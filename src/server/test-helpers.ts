import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { BookSettings, CreateBookRequest } from '../shared/types.js';
import type { ImageGenerator } from './images/image-service.js';
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

export const testSettings: BookSettings = {
  language: 'fi',
  genre: 'Fantasia',
  style: 'Synkkä',
  realism: 'Maanläheinen',
  audience: 'Aikuiset',
  darkness: 'Synkkä',
  artStyle: 'Tussipiirros',
  author: 'Tove Jansson',
  length: 'short',
};

export function createRequest(
  settings: Partial<BookSettings> = {},
): CreateBookRequest {
  return {
    settings: { ...testSettings, ...settings },
    idea: 'A stolen bell',
    title: 'The Test Book',
    blurb: 'Someone has stolen the bell of Varrow.',
  };
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
    milestones: [],
    ...overrides,
  };
}

export function openingOutput(text = 'Page one'): OpeningOutput {
  return {
    plan: {
      truth: 'The mayor stole the bell.',
      milestones: ['The reader finds the bell', 'The reader exposes the mayor'],
      endings: ['The bell rings again', 'The reader is run out of town'],
      toneRules: ['Grounded, with dry humor'],
    },
    world: {
      people: [
        { name: 'Mara', description: 'A smuggler.', looks: 'Red coat.' },
      ],
      places: [
        { name: 'Varrow', description: 'A town.', looks: 'Grey houses.' },
      ],
      details: ['It is winter.'],
    },
    coverPrompt: 'Cover of the test book',
    page: pageOutput(text),
  };
}

/** Returns the prompt as the image and records the prompts. */
export class FakeImageGenerator implements ImageGenerator {
  readonly prompts: string[] = [];
  failing = false;

  async generate(prompt: string): Promise<Buffer> {
    this.prompts.push(prompt);
    if (this.failing) throw new Error('Draw Things is not running');
    return Buffer.from(prompt);
  }
}
