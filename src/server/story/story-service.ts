import { randomUUID } from 'node:crypto';

import type {
  AuthorSuggestion,
  Book,
  BookSettings,
  Language,
  Page,
} from '../../shared/types.js';
import type { ModelClient } from '../model/model-client.js';
import { type BookStore, getPath } from '../store/book-store.js';
import {
  authorsBlocks,
  authorsSystemPrompt,
  bookSystemPrompt,
  openingBlocks,
  openingSystemPrompt,
  pathBlocks,
} from './prompts.js';
import {
  authorsOutputSchema,
  openingOutputSchema,
  type PageOutput,
  pageOutputSchema,
} from './schemas.js';

export class NotFoundError extends Error {}

export interface ChooseResult {
  page: Page;
  /** False if the page was already saved and Claude was not called. */
  created: boolean;
}

export class StoryService {
  /** Page writes in progress, so that a double click writes one page. */
  private readonly inFlight = new Map<string, Promise<ChooseResult>>();
  private readonly authorCache = new Map<string, AuthorSuggestion[]>();

  constructor(
    private readonly store: BookStore,
    private readonly model: ModelClient,
    private readonly newId: () => string = () => randomUUID().slice(0, 8),
  ) {}

  async createBook(settings: BookSettings): Promise<Book> {
    const out = await this.model.generate({
      purpose: 'opening',
      system: openingSystemPrompt(settings),
      blocks: openingBlocks(),
      schema: openingOutputSchema,
    });
    const page = this.makePage(out.page, null, null, null);
    const book: Book = {
      id: this.newId(),
      title: out.title,
      createdAt: new Date().toISOString(),
      settings,
      world: out.world,
      firstPageId: page.id,
    };
    await this.store.savePage(book.id, page);
    await this.store.saveBook(book);
    await this.store.saveState(book.id, { currentPageId: page.id });
    return book;
  }

  listBooks(): Promise<Book[]> {
    return this.store.listBooks();
  }

  async getBook(bookId: string): Promise<Book> {
    const book = await this.store.getBook(bookId);
    if (!book) throw new NotFoundError(`Book ${bookId} not found`);
    return book;
  }

  async getCurrentPageId(book: Book): Promise<string> {
    const state = await this.store.getState(book.id);
    return state?.currentPageId ?? book.firstPageId;
  }

  async getPage(bookId: string, pageId: string): Promise<Page> {
    const page = await this.store.getPage(bookId, pageId);
    if (!page) throw new NotFoundError(`Page ${pageId} not found`);
    return page;
  }

  /** The page number on the path and which actions already have a page. */
  async describePage(
    bookId: string,
    page: Page,
  ): Promise<{ depth: number; written: boolean[] }> {
    const path = await getPath(this.store, bookId, page.id);
    const written = await Promise.all(
      page.actions.map(
        async (_, i) =>
          (await this.store.findChild(bookId, page.id, i)) !== undefined,
      ),
    );
    return { depth: path.length, written };
  }

  async setCurrentPage(bookId: string, pageId: string): Promise<void> {
    await this.getPage(bookId, pageId);
    await this.store.saveState(bookId, { currentPageId: pageId });
  }

  /**
   * Returns the page that follows from picking an action. A saved page is
   * returned as it is; otherwise Claude writes a new page.
   */
  async choose(
    bookId: string,
    pageId: string,
    choiceIndex: number,
  ): Promise<ChooseResult> {
    const key = `${bookId}/${pageId}/${choiceIndex}`;
    const running = this.inFlight.get(key);
    if (running) return running;
    const promise = this.doChoose(bookId, pageId, choiceIndex).finally(() =>
      this.inFlight.delete(key),
    );
    this.inFlight.set(key, promise);
    return promise;
  }

  private async doChoose(
    bookId: string,
    pageId: string,
    choiceIndex: number,
  ): Promise<ChooseResult> {
    const book = await this.getBook(bookId);
    const parent = await this.getPage(bookId, pageId);
    if (
      !Number.isInteger(choiceIndex) ||
      choiceIndex < 0 ||
      choiceIndex >= parent.actions.length
    ) {
      throw new NotFoundError(`Page ${pageId} has no action ${choiceIndex}`);
    }

    const saved = await this.store.findChild(bookId, pageId, choiceIndex);
    if (saved) {
      await this.store.saveState(bookId, { currentPageId: saved.id });
      return { page: saved, created: false };
    }

    const path = await getPath(this.store, bookId, pageId);
    const out = await this.model.generate({
      purpose: `page ${path.length + 1} of ${bookId}`,
      system: bookSystemPrompt(book),
      blocks: pathBlocks(path, choiceIndex),
      schema: pageOutputSchema,
    });
    const page = this.makePage(
      out,
      parent.id,
      choiceIndex,
      parent.actions[choiceIndex] ?? null,
    );
    await this.store.savePage(bookId, page);
    await this.store.saveState(bookId, { currentPageId: page.id });
    return { page, created: true };
  }

  async suggestAuthors(
    language: Language,
    genre: string,
    style: string,
  ): Promise<AuthorSuggestion[]> {
    const key = JSON.stringify([language, genre, style]);
    const cached = this.authorCache.get(key);
    if (cached) return cached;
    const out = await this.model.generate({
      purpose: 'author suggestions',
      system: authorsSystemPrompt(),
      blocks: authorsBlocks(language, genre, style),
      schema: authorsOutputSchema,
      effort: 'low',
    });
    this.authorCache.set(key, out.authors);
    return out.authors;
  }

  private makePage(
    out: PageOutput,
    parentId: string | null,
    choiceIndex: number | null,
    choice: string | null,
  ): Page {
    return {
      id: this.newId(),
      parentId,
      choiceIndex,
      choice,
      text: out.text,
      actions: out.actions,
      imagePrompt: out.imagePrompt,
      worldChanges: out.worldChanges,
      createdAt: new Date().toISOString(),
    };
  }
}
