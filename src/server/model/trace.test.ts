import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { FileBookStore } from '../store/file-book-store.js';
import { StoryService } from '../story/story-service.js';
import {
  FakeModelClient,
  openingOutput,
  pageOutput,
  tempDir,
} from '../test-helpers.js';
import { FileTracer } from './trace.js';

describe('FileTracer', () => {
  it('writes the files of a call with the same time stamp and action', async () => {
    const dir = await tempDir();
    const trace = new FileTracer(dir).start('book1', 'page-2');
    await trace.write('request.json', { a: 1 });
    await trace.write('prompt.md', '# Hello');

    const files = (await readdir(path.join(dir, 'book1', 'trace'))).sort();
    expect(files).toHaveLength(2);
    expect(files[0]).toMatch(/^\d{8}T\d{6}\.\d{3}Z-page-2\.prompt\.md$/);
    expect(files[1]).toBe(files[0]!.replace('prompt.md', 'request.json'));
    const json = await readFile(
      path.join(dir, 'book1', 'trace', files[1]!),
      'utf8',
    );
    expect(JSON.parse(json)).toEqual({ a: 1 });
  });

  it('gives each call of a book its own trace in the folder of the book', async () => {
    const dir = await tempDir();
    const model = new FakeModelClient().queue(
      openingOutput(),
      pageOutput('Two'),
      { authors: [] },
    );
    const story = new StoryService(new FileBookStore(dir), model, {
      tracer: new FileTracer(dir),
    });
    const book = await story.createBook({
      language: 'en',
      genre: 'Fantasy',
      style: 'Epic',
      artStyle: 'Ink',
      author: null,
    });
    await story.choose(book.id, book.firstPageId, 0);
    await story.suggestAuthors('en', 'Fantasy', 'Epic');

    // The fake client does not write files; the service starts the traces.
    const [opening, page, authors] = model.requests.map((r) => r.trace);
    expect(opening).toBeDefined();
    expect(page).toBeDefined();
    expect(authors).toBeDefined();
    await page!.write('x.txt', 'x');
    await authors!.write('x.txt', 'x');
    expect(await readdir(path.join(dir, book.id, 'trace'))).toEqual([
      expect.stringMatching(/-page-2\.x\.txt$/),
    ]);
    expect(await readdir(path.join(dir, '.trace'))).toEqual([
      expect.stringMatching(/-authors\.x\.txt$/),
    ]);
    // The trace folder does not show up as a book.
    expect((await story.listBooks()).map((b) => b.id)).toEqual([book.id]);
  });
});
