import { beforeEach, describe, expect, it } from 'vitest';

import type {
  BookResponse,
  BookSummary,
  CreateBookResponse,
  PageResponse,
  RegenerateImageResponse,
} from '../shared/types.js';
import { createApp } from './app.js';
import { ImageService } from './images/image-service.js';
import { FileBookStore } from './store/file-book-store.js';
import { StoryService } from './story/story-service.js';
import {
  FakeImageGenerator,
  FakeModelClient,
  openingOutput,
  pageOutput,
  tempDir,
} from './test-helpers.js';

const settings = {
  language: 'en',
  genre: 'Fantasy',
  style: 'Grimdark',
  realism: 'Grounded',
  audience: '',
  darkness: 'Grim',
  artStyle: 'Ink drawing',
  author: '',
  length: 'medium',
};

const createBody = {
  settings,
  idea: '',
  title: 'The Rope',
  blurb: 'You hang by a thread.',
};

describe('API', () => {
  let model: FakeModelClient;
  let generator: FakeImageGenerator;
  let images: ImageService;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    model = new FakeModelClient();
    generator = new FakeImageGenerator();
    const store = new FileBookStore(await tempDir());
    images = new ImageService(store, generator);
    app = createApp(new StoryService(store, model), images);
  });

  const json = (method: string, body?: unknown) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  async function createBook() {
    model.queue(openingOutput());
    const res = await app.request('/api/books', json('POST', createBody));
    expect(res.status).toBe(201);
    return ((await res.json()) as CreateBookResponse).book;
  }

  it('creates, lists and opens a book', async () => {
    const book = await createBook();
    expect(book.settings.author).toBeNull();
    expect(book.idea).toBeNull();
    expect(book.blurb).toBe('You hang by a thread.');

    const list = (await (
      await app.request('/api/books')
    ).json()) as BookSummary[];
    expect(list.map((b) => b.id)).toEqual([book.id]);

    const opened = (await (
      await app.request(`/api/books/${book.id}`)
    ).json()) as BookResponse;
    expect(opened.currentPageId).toBe(book.firstPageId);
  });

  it('plays a choice, goes back and continues from the saved position', async () => {
    const book = await createBook();
    model.queue(pageOutput('Next'));
    const res = await app.request(
      `/api/books/${book.id}/pages/${book.firstPageId}/choose`,
      json('POST', { choiceIndex: 1 }),
    );
    const next = (await res.json()) as PageResponse;
    expect(next.page.text).toBe('Next');
    expect(next.depth).toBe(2);

    const first = (await (
      await app.request(`/api/books/${book.id}/pages/${book.firstPageId}`)
    ).json()) as PageResponse;
    expect(first.written).toEqual([false, true]);

    const put = await app.request(
      `/api/books/${book.id}/position`,
      json('PUT', { pageId: book.firstPageId }),
    );
    expect(put.status).toBe(204);
    const opened = (await (
      await app.request(`/api/books/${book.id}`)
    ).json()) as BookResponse;
    expect(opened.currentPageId).toBe(book.firstPageId);
  });

  it('makes the cover and the page images and serves them', async () => {
    const book = await createBook();
    const opened = (await (
      await app.request(`/api/books/${book.id}`)
    ).json()) as BookResponse;
    expect(opened.cover).toBe('pending');
    await images.whenIdle();
    expect(generator.prompts).toEqual([
      'Cover of the test book',
      'Image of Page one',
    ]);

    const list = (await (
      await app.request('/api/books')
    ).json()) as BookSummary[];
    expect(list[0]?.cover).toBe('ready');
    const page = (await (
      await app.request(`/api/books/${book.id}/pages/${book.firstPageId}`)
    ).json()) as PageResponse;
    expect(page.image).toBe('ready');

    const cover = await app.request(`/api/books/${book.id}/images/cover`);
    expect(cover.headers.get('Content-Type')).toBe('image/png');
    expect(await cover.text()).toBe('Cover of the test book');
    const missing = await app.request(`/api/books/${book.id}/images/nope`);
    expect(missing.status).toBe(404);
  });

  it('makes an image again on request', async () => {
    const book = await createBook();
    await app.request(`/api/books/${book.id}`);
    await images.whenIdle();
    generator.prompts.length = 0;

    const regenerate = (imageId: string) =>
      app.request(`/api/books/${book.id}/images/${imageId}/regenerate`, {
        method: 'POST',
      });
    const res = await regenerate('cover');
    expect(((await res.json()) as RegenerateImageResponse).image).toBe(
      'pending',
    );
    expect(
      (await app.request(`/api/books/${book.id}/images/cover`)).status,
    ).toBe(404);
    await regenerate(book.firstPageId);
    await images.whenIdle();
    expect(generator.prompts).toEqual([
      'Cover of the test book',
      'Image of Page one',
    ]);
    expect((await regenerate('nope')).status).toBe(404);
  });

  it('rejects bad input', async () => {
    const missing = await app.request(
      '/api/books',
      json('POST', { ...createBody, settings: { ...settings, genre: '' } }),
    );
    expect(missing.status).toBe(400);
    const badLanguage = await app.request(
      '/api/books',
      json('POST', {
        ...createBody,
        settings: { ...settings, language: 'sv' },
      }),
    );
    expect(badLanguage.status).toBe(400);
    const traversal = await app.request(
      `/api/books/abc/position`,
      json('PUT', { pageId: '../../etc' }),
    );
    expect(traversal.status).toBe(400);
  });

  it('writes a blurb', async () => {
    model.queue({ title: 'The Rope', blurb: 'You hang.' });
    const res = await app.request(
      '/api/pitch',
      json('POST', { settings, idea: null, comments: 'Darker' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ title: 'The Rope', blurb: 'You hang.' });
    const empty = await app.request(
      '/api/pitch',
      json('POST', { settings, idea: null, current: { title: '', blurb: '' } }),
    );
    expect(empty.status).toBe(400);
  });

  it('answers 404 for a missing book or page', async () => {
    expect((await app.request('/api/books/nope')).status).toBe(404);
    const book = await createBook();
    expect((await app.request(`/api/books/${book.id}/pages/nope`)).status).toBe(
      404,
    );
  });

  it('answers 502 when the model fails', async () => {
    const res = await app.request('/api/books', json('POST', createBody));
    expect(res.status).toBe(502);
  });
});
