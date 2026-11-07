import { beforeEach, describe, expect, it } from 'vitest';

import type {
  BookResponse,
  BookSummary,
  CreateBookResponse,
  PageResponse,
} from '../shared/types.js';
import { createApp } from './app.js';
import { FileBookStore } from './store/file-book-store.js';
import { StoryService } from './story/story-service.js';
import {
  FakeModelClient,
  openingOutput,
  pageOutput,
  tempDir,
} from './test-helpers.js';

const settings = {
  language: 'en',
  genre: 'Fantasy',
  style: 'Grimdark',
  artStyle: 'Ink drawing',
  author: '',
};

describe('API', () => {
  let model: FakeModelClient;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    model = new FakeModelClient();
    app = createApp(
      new StoryService(new FileBookStore(await tempDir()), model),
    );
  });

  const json = (method: string, body?: unknown) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  async function createBook() {
    model.queue(openingOutput());
    const res = await app.request('/api/books', json('POST', settings));
    expect(res.status).toBe(201);
    return ((await res.json()) as CreateBookResponse).book;
  }

  it('creates, lists and opens a book', async () => {
    const book = await createBook();
    expect(book.settings.author).toBeNull();

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

  it('rejects bad input', async () => {
    const missing = await app.request(
      '/api/books',
      json('POST', { ...settings, genre: '' }),
    );
    expect(missing.status).toBe(400);
    const badLanguage = await app.request(
      '/api/books',
      json('POST', { ...settings, language: 'sv' }),
    );
    expect(badLanguage.status).toBe(400);
    const traversal = await app.request(
      `/api/books/abc/position`,
      json('PUT', { pageId: '../../etc' }),
    );
    expect(traversal.status).toBe(400);
  });

  it('answers 404 for a missing book or page', async () => {
    expect((await app.request('/api/books/nope')).status).toBe(404);
    const book = await createBook();
    expect((await app.request(`/api/books/${book.id}/pages/nope`)).status).toBe(
      404,
    );
  });

  it('answers 502 when the model fails', async () => {
    const res = await app.request('/api/books', json('POST', settings));
    expect(res.status).toBe(502);
  });
});
