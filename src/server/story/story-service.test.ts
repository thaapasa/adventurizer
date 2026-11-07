import { beforeEach, describe, expect, it } from 'vitest';

import type { BookSettings } from '../../shared/types.js';
import { FileBookStore } from '../store/file-book-store.js';
import {
  FakeModelClient,
  openingOutput,
  pageOutput,
  tempDir,
} from '../test-helpers.js';
import { NotFoundError, StoryService } from './story-service.js';

const settings: BookSettings = {
  language: 'fi',
  genre: 'Fantasia',
  style: 'Synkkä',
  artStyle: 'Tussipiirros',
  author: 'Tove Jansson',
};

describe('StoryService', () => {
  let model: FakeModelClient;
  let dir: string;
  let story: StoryService;

  beforeEach(async () => {
    model = new FakeModelClient();
    dir = await tempDir();
    story = new StoryService(new FileBookStore(dir), model);
  });

  it('creates a book with the world base and the first page', async () => {
    model.queue(openingOutput('It begins'));
    const book = await story.createBook(settings);

    expect(book.title).toBe('The Test Book');
    expect(book.world.people[0]?.name).toBe('Mara');
    const first = await story.getPage(book.id, book.firstPageId);
    expect(first.text).toBe('It begins');
    expect(first.parentId).toBeNull();
    expect(await story.getCurrentPageId(book)).toBe(first.id);

    const system = model.requests[0]!.system;
    expect(system).toContain('Language: Finnish');
    expect(system).toContain('Tove Jansson');
    expect(system).toContain('Tussipiirros');
  });

  it('tells the agent to blend the styles of a mix of authors', async () => {
    model.queue(openingOutput());
    await story.createBook({
      ...settings,
      author: 'Joe Abercrombie meets Terry Pratchett',
    });
    const system = model.requests[0]!.system;
    expect(system).toContain(
      'Author style: Joe Abercrombie meets Terry Pratchett.',
    );
    expect(system).toContain('blend their styles');
  });

  it('writes a new page for a new choice and replays a saved one', async () => {
    model.queue(openingOutput(), pageOutput('Left page'));
    const book = await story.createBook(settings);

    const first = await story.choose(book.id, book.firstPageId, 0);
    expect(first.created).toBe(true);
    expect(first.page.choice).toBe('Go left');

    const again = await story.choose(book.id, book.firstPageId, 0);
    expect(again.created).toBe(false);
    expect(again.page.id).toBe(first.page.id);
    expect(model.requests).toHaveLength(2);
  });

  it('keeps the pages after a restart of the server', async () => {
    model.queue(openingOutput(), pageOutput('Left page'));
    const book = await story.createBook(settings);
    const { page } = await story.choose(book.id, book.firstPageId, 0);

    const restarted = new StoryService(new FileBookStore(dir), model);
    const replay = await restarted.choose(book.id, book.firstPageId, 0);
    expect(replay).toEqual({ page, created: false });
    expect(await restarted.getCurrentPageId(book)).toBe(page.id);
  });

  it('gives the agent the full text of the current path only', async () => {
    model.queue(
      openingOutput('Page one'),
      pageOutput('Left page', { worldChanges: ['The mill burned down'] }),
      pageOutput('Right page', { worldChanges: ['Mara is an ally'] }),
      pageOutput('Deeper page'),
    );
    const book = await story.createBook(settings);
    const left = await story.choose(book.id, book.firstPageId, 0);
    await story.choose(book.id, book.firstPageId, 1);
    await story.choose(book.id, left.page.id, 1);

    const blocks = model.requests[3]!.blocks.join('\n');
    expect(blocks).toContain('Page one');
    expect(blocks).toContain('Left page');
    expect(blocks).toContain('The mill burned down');
    expect(blocks).toContain('The reader picks action 2: Go right');
    // The other branch is not on this path.
    expect(blocks).not.toContain('Right page');
    expect(blocks).not.toContain('Mara is an ally');
  });

  it('keeps the earlier blocks of a path the same for the prompt cache', async () => {
    model.queue(openingOutput(), pageOutput('Two'), pageOutput('Three'));
    const book = await story.createBook(settings);
    const two = await story.choose(book.id, book.firstPageId, 0);
    await story.choose(book.id, two.page.id, 0);

    const [, second, third] = model.requests;
    expect(third!.system).toBe(second!.system);
    expect(third!.blocks.slice(0, second!.blocks.length)).toEqual(
      second!.blocks,
    );
  });

  it('writes one page when the same choice is made twice at once', async () => {
    model.queue(openingOutput(), pageOutput('Left page'));
    const book = await story.createBook(settings);
    const [a, b] = await Promise.all([
      story.choose(book.id, book.firstPageId, 0),
      story.choose(book.id, book.firstPageId, 0),
    ]);
    expect(a.page.id).toBe(b.page.id);
    expect(model.requests).toHaveLength(2);
  });

  it('rejects an action that the page does not have', async () => {
    model.queue(openingOutput());
    const book = await story.createBook(settings);
    await expect(story.choose(book.id, book.firstPageId, 5)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('tells which actions already have a page', async () => {
    model.queue(openingOutput(), pageOutput('Right page'));
    const book = await story.createBook(settings);
    const right = await story.choose(book.id, book.firstPageId, 1);

    const first = await story.getPage(book.id, book.firstPageId);
    expect(await story.describePage(book.id, first)).toEqual({
      depth: 1,
      written: [false, true],
    });
    expect((await story.describePage(book.id, right.page)).depth).toBe(2);
  });

  it('caches the author suggestions', async () => {
    model.queue({ authors: [{ name: 'Tove Jansson', note: 'Muumit' }] });
    const a = await story.suggestAuthors('fi', 'Fantasia', 'Leppoisa');
    const b = await story.suggestAuthors('fi', 'Fantasia', 'Leppoisa');
    expect(a).toEqual(b);
    expect(model.requests).toHaveLength(1);
    expect(model.requests[0]!.blocks[0]).toContain('Finnish');
  });
});
