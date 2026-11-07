import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ClaudeCodeModelClient,
  type RunCommand,
  userMessageLine,
} from './claude-code-client.js';
import { ModelError } from './model-client.js';

const schema = z.object({ answer: z.number() });

function resultLine(extra: Record<string, unknown>): string {
  return JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    usage: { input_tokens: 1, output_tokens: 2 },
    ...extra,
  });
}

function client(stdout: string, calls: Parameters<RunCommand>[] = []) {
  const run: RunCommand = async (...args) => {
    calls.push(args);
    return { code: 0, stdout, stderr: '' };
  };
  return new ClaudeCodeModelClient({
    model: 'claude-opus-5-5',
    effort: 'medium',
    run,
  });
}

const request = {
  purpose: 'test',
  system: 'System prompt',
  blocks: ['one', 'two'],
  schema,
};

describe('ClaudeCodeModelClient', () => {
  it('returns the structured output of the result event', async () => {
    const stdout = [
      JSON.stringify({ type: 'system', subtype: 'init' }),
      resultLine({ structured_output: { answer: 42 } }),
      '',
    ].join('\n');
    await expect(client(stdout).generate(request)).resolves.toEqual({
      answer: 42,
    });
  });

  it('runs claude without tools, with the schema and the blocks', async () => {
    const calls: Parameters<RunCommand>[] = [];
    await client(
      resultLine({ structured_output: { answer: 1 } }),
      calls,
    ).generate(request);

    const [command, args, options] = calls[0]!;
    expect(command).toBe('claude');
    expect(args).toContain('-p');
    expect(args[args.indexOf('--tools') + 1]).toBe('');
    expect(args[args.indexOf('--model') + 1]).toBe('claude-opus-5-5');
    const jsonSchema = JSON.parse(args[args.indexOf('--json-schema') + 1]!);
    expect(jsonSchema.properties.answer.type).toBe('number');
    expect(options.input).toBe(userMessageLine(['one', 'two']));
    expect(options.env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('fails when the output does not match the schema', async () => {
    const stdout = resultLine({ structured_output: { answer: 'no' } });
    await expect(client(stdout).generate(request)).rejects.toThrow(ModelError);
  });

  it('fails when claude reports an error', async () => {
    const stdout = resultLine({
      subtype: 'error_during_execution',
      is_error: true,
    });
    await expect(client(stdout).generate(request)).rejects.toThrow(
      /error_during_execution/,
    );
  });

  it('fails when claude prints no result', async () => {
    await expect(client('Not logged in').generate(request)).rejects.toThrow(
      /Not logged in/,
    );
  });
});
