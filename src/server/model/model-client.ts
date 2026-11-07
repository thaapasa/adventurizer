import type { z } from 'zod';

import type { Trace } from './trace.js';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ModelRequest<T> {
  /** Used in log lines. */
  purpose: string;
  /** Stays the same for every request of a book, so that it can be cached. */
  system: string;
  /**
   * The parts of the user message. Earlier requests of the same path send
   * the same blocks first, so everything before the last block can be cached.
   */
  blocks: string[];
  schema: z.ZodType<T>;
  effort?: Effort;
  /** If set, the client writes what it sends and gets back here. */
  trace?: Trace;
}

/** Sends one request to Claude and returns the JSON that matches the schema. */
export interface ModelClient {
  generate<T>(request: ModelRequest<T>): Promise<T>;
}

export class ModelError extends Error {}

/**
 * The prompt of a request as Markdown, for reading in an editor. The request
 * and response files of a trace hold the exact data.
 */
export function promptMarkdown(
  request: ModelRequest<unknown>,
  schema: unknown,
): string {
  return [
    '# System prompt',
    '',
    request.system,
    '',
    '# User message',
    '',
    request.blocks.join('\n\n---\n\n'),
    '',
    '# Output schema',
    '',
    '```json',
    JSON.stringify(schema, null, 2),
    '```',
    '',
  ].join('\n');
}
