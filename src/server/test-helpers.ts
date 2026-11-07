import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { ModelClient, ModelRequest } from './model/model-client.js';
import { ModelError } from './model/model-client.js';
import type { OpeningOutput, PageOutput } from './story/schemas.js';

export async function tempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'adventurizer-test-'));
}

/** Answers each request with the next queued answer and records the request. */
export class FakeModelClient implements ModelClient {
  readonly requests: ModelRequest<unknown>[] = [];
  private readonly answers: unknown[] = [];

  queue(...answers: unknown[]): this {
    this.answers.push(...answers);
    return this;
  }

  async generate<T>(request: ModelRequest<T>): Promise<T> {
    this.requests.push(request as ModelRequest<unknown>);
    if (this.answers.length === 0) throw new ModelError('No answer queued');
    return request.schema.parse(this.answers.shift());
  }
}

export function pageOutput(
  text: string,
  overrides: Partial<PageOutput> = {},
): PageOutput {
  return {
    text,
    actions: ['Go left', 'Go right'],
    imagePrompt: `Image of ${text}`,
    worldChanges: [],
    ...overrides,
  };
}

export function openingOutput(text = 'Page one'): OpeningOutput {
  return {
    title: 'The Test Book',
    world: {
      people: [
        { name: 'Mara', description: 'A smuggler.', looks: 'Red coat.' },
      ],
      places: [
        { name: 'Varrow', description: 'A town.', looks: 'Grey houses.' },
      ],
      details: ['It is winter.'],
    },
    page: pageOutput(text),
  };
}
