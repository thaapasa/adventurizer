import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Book, Page } from '../../shared/types.js';
import type { BookState, BookStore } from './book-store.js';

const idPattern = /^[A-Za-z0-9_-]+$/;

/** Checks an ID before it becomes part of a file path. */
export function isValidId(id: string): boolean {
  return idPattern.test(id);
}

function checkId(id: string): string {
  if (!isValidId(id)) throw new Error(`Invalid ID: ${id}`);
  return id;
}

/**
 * Stores each book as a folder: `book.json`, `state.json` and one file per
 * page in `pages/`. The pages of a book are read into memory the first time
 * the book is used, so that finding the children of a page needs no file scan.
 */
export class FileBookStore implements BookStore {
  private readonly pageCache = new Map<string, Map<string, Page>>();

  constructor(private readonly rootDir: string) {}

  async listBooks(): Promise<Book[]> {
    await mkdir(this.rootDir, { recursive: true });
    const entries = await readdir(this.rootDir, { withFileTypes: true });
    const books: Book[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !isValidId(entry.name)) continue;
      const book = await this.getBook(entry.name);
      if (book) books.push(book);
    }
    return books.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getBook(bookId: string): Promise<Book | undefined> {
    return readJson<Book>(path.join(this.bookDir(bookId), 'book.json'));
  }

  async saveBook(book: Book): Promise<void> {
    await writeJson(path.join(this.bookDir(book.id), 'book.json'), book);
  }

  async getPage(bookId: string, pageId: string): Promise<Page | undefined> {
    checkId(pageId);
    return (await this.loadPages(bookId)).get(pageId);
  }

  async findChild(
    bookId: string,
    parentId: string,
    choiceIndex: number,
  ): Promise<Page | undefined> {
    for (const page of (await this.loadPages(bookId)).values()) {
      if (page.parentId === parentId && page.choiceIndex === choiceIndex) {
        return page;
      }
    }
    return undefined;
  }

  async savePage(bookId: string, page: Page): Promise<void> {
    const pages = await this.loadPages(bookId);
    await writeJson(
      path.join(this.bookDir(bookId), 'pages', `${checkId(page.id)}.json`),
      page,
    );
    pages.set(page.id, page);
  }

  async getState(bookId: string): Promise<BookState | undefined> {
    return readJson<BookState>(path.join(this.bookDir(bookId), 'state.json'));
  }

  async saveState(bookId: string, state: BookState): Promise<void> {
    await writeJson(path.join(this.bookDir(bookId), 'state.json'), state);
  }

  private bookDir(bookId: string): string {
    return path.join(this.rootDir, checkId(bookId));
  }

  private async loadPages(bookId: string): Promise<Map<string, Page>> {
    const cached = this.pageCache.get(bookId);
    if (cached) return cached;
    const dir = path.join(this.bookDir(bookId), 'pages');
    const pages = new Map<string, Page>();
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const page = await readJson<Page>(path.join(dir, file));
      if (page) pages.set(page.id, page);
    }
    this.pageCache.set(bookId, pages);
    return pages;
  }
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (e) {
    if (isNotFound(e)) return undefined;
    throw e;
  }
}

/** Writes through a temporary file, so a crash never leaves half a file. */
async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(tmp, file);
}

function isNotFound(e: unknown): boolean {
  return (e as NodeJS.ErrnoException)?.code === 'ENOENT';
}
