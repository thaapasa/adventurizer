import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import type { Effort, ModelClient, ModelRequest } from './model-client.js';
import { ModelError } from './model-client.js';

export interface ClaudeCodeOptions {
  model: string;
  effort: Effort;
  /** The `claude` command. */
  command?: string;
  timeoutMs?: number;
  run?: RunCommand;
}

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export type RunCommand = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    input: string;
    env: NodeJS.ProcessEnv;
    timeoutMs: number;
  },
) => Promise<RunResult>;

const resultSchema = z.object({
  is_error: z.boolean().optional(),
  subtype: z.string().optional(),
  result: z.string().optional(),
  structured_output: z.unknown().optional(),
  total_cost_usd: z.number().optional(),
  duration_ms: z.number().optional(),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
      cache_read_input_tokens: z.number().optional(),
      cache_creation_input_tokens: z.number().optional(),
    })
    .optional(),
});

/**
 * Runs `claude -p` with the login of the local Claude Code, so the book can
 * be written without an API key.
 */
export class ClaudeCodeModelClient implements ModelClient {
  constructor(private readonly options: ClaudeCodeOptions) {}

  async generate<T>(request: ModelRequest<T>): Promise<T> {
    // Claude Code reads settings and CLAUDE.md files from its working folder
    // and the folders above it, so it runs in an empty temporary folder.
    const dir = await mkdtemp(path.join(tmpdir(), 'adventurizer-'));
    try {
      const systemFile = path.join(dir, 'system.md');
      await writeFile(systemFile, request.system, 'utf8');
      const args = buildArgs(request, this.options, systemFile);
      const run = this.options.run ?? runCommand;
      const started = Date.now();
      const out = await run(this.options.command ?? 'claude', args, {
        cwd: dir,
        input: userMessageLine(request.blocks),
        env: childEnv(),
        timeoutMs: this.options.timeoutMs ?? 10 * 60_000,
      });
      return parseResult(out, request, Date.now() - started);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

export function buildArgs(
  request: ModelRequest<unknown>,
  options: ClaudeCodeOptions,
  systemFile: string,
): string[] {
  const schema = betaZodOutputFormat(request.schema).schema;
  return [
    '-p',
    '--input-format',
    'stream-json',
    '--output-format',
    'stream-json',
    '--verbose',
    '--json-schema',
    JSON.stringify(schema),
    '--system-prompt-file',
    systemFile,
    '--tools',
    '',
    '--model',
    options.model,
    '--effort',
    request.effort ?? options.effort,
    '--no-session-persistence',
    '--strict-mcp-config',
    '--setting-sources',
    '',
    '--disable-slash-commands',
  ];
}

/**
 * The user message as one line of stream-json input. Each block is a separate
 * content block, so that the earlier blocks of a path can come from the
 * prompt cache.
 */
export function userMessageLine(blocks: string[]): string {
  const message = {
    type: 'user',
    message: {
      role: 'user',
      content: blocks.map((text) => ({ type: 'text', text })),
    },
  };
  return JSON.stringify(message) + '\n';
}

/** Finds the result event among the stream-json events on stdout. */
function findResult(stdout: string): unknown {
  const lines = stdout.split('\n').filter((line) => line.trim());
  for (const line of lines.reverse()) {
    try {
      const event = JSON.parse(line) as { type?: string };
      if (event.type === 'result') return event;
    } catch {
      // Not a JSON line; Claude Code can also print plain warnings.
    }
  }
  return undefined;
}

/**
 * Leaves out the API key, so that Claude Code uses its own login even when
 * `.env` has a key for the api backend.
 */
function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  return env;
}

export function parseResult<T>(
  out: RunResult,
  request: ModelRequest<T>,
  elapsedMs: number,
): T {
  const json = findResult(out.stdout);
  if (json === undefined) {
    throw new ModelError(
      `claude exited with code ${out.code}: ${(out.stderr || out.stdout).slice(0, 500)}`,
    );
  }
  const parsed = resultSchema.safeParse(json);
  if (!parsed.success) {
    throw new ModelError('claude printed an unexpected result');
  }
  const res = parsed.data;
  const u = res.usage;
  console.log(
    `[claude-code] ${request.purpose}: ${elapsedMs} ms, ` +
      `input ${u?.input_tokens ?? 0}, cache read ${u?.cache_read_input_tokens ?? 0}, ` +
      `cache write ${u?.cache_creation_input_tokens ?? 0}, output ${u?.output_tokens ?? 0}, ` +
      `cost $${(res.total_cost_usd ?? 0).toFixed(4)}`,
  );
  if (res.is_error || res.subtype !== 'success') {
    throw new ModelError(
      `claude failed (${res.subtype ?? 'error'}): ${(res.result ?? '').slice(0, 500)}`,
    );
  }
  const value = request.schema.safeParse(res.structured_output);
  if (!value.success) {
    throw new ModelError(
      `${request.purpose}: the answer did not match the schema: ${value.error.message}`,
    );
  }
  return value.data;
}

const runCommand: RunCommand = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: options.timeoutMs,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (d: string) => (stdout += d));
    child.stderr.setEncoding('utf8').on('data', (d: string) => (stderr += d));
    child.on('error', (e) =>
      reject(new ModelError(`Could not run ${command}: ${e.message}`)),
    );
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(options.input);
  });
