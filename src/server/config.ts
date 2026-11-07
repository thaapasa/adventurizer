import type { Effort } from './model/model-client.js';

export type Backend = 'claude-code' | 'api';

export interface Config {
  port: number;
  booksDir: string;
  backend: Backend;
  model: string;
  effort: Effort;
  claudeCommand: string;
  /** Writes the data of every call to Claude in the folder of the book. */
  trace: boolean;
}

const efforts: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

export function readConfig(env: NodeJS.ProcessEnv): Config {
  const backend = env.STORY_BACKEND ?? 'claude-code';
  if (backend !== 'claude-code' && backend !== 'api') {
    throw new Error(`STORY_BACKEND must be claude-code or api, not ${backend}`);
  }
  const effort = (env.CLAUDE_EFFORT ?? 'medium') as Effort;
  if (!efforts.includes(effort)) {
    throw new Error(`CLAUDE_EFFORT must be one of ${efforts.join(', ')}`);
  }
  if (backend === 'api' && !env.ANTHROPIC_API_KEY) {
    throw new Error('STORY_BACKEND=api needs ANTHROPIC_API_KEY');
  }
  return {
    port: Number(env.PORT ?? 10600),
    booksDir: env.BOOKS_DIR ?? 'books',
    backend,
    model: env.CLAUDE_MODEL ?? 'claude-opus-5-5',
    effort,
    claudeCommand: env.CLAUDE_COMMAND ?? 'claude',
    trace: ['1', 'true', 'yes', 'on'].includes((env.TRACE ?? '').toLowerCase()),
  };
}
