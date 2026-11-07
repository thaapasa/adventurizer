import type { z } from 'zod';

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
}

/** Sends one request to Claude and returns the JSON that matches the schema. */
export interface ModelClient {
  generate<T>(request: ModelRequest<T>): Promise<T>;
}

export class ModelError extends Error {}
