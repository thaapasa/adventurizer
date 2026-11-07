import type { Book, Page } from '../../shared/types.js';

export interface BookState {
  currentPageId: string;
}

/**
 * Storage for the books. The file version keeps one folder per book; the
 * interface lets the storage move to a database later.
 */
export interface BookStore {
  listBooks(): Promise<Book[]>;
  getBook(bookId: string): Promise<Book | undefined>;
  saveBook(book: Book): Promise<void>;
  getPage(bookId: string, pageId: string): Promise<Page | undefined>;
  /** The page that the action `choiceIndex` on page `parentId` leads to. */
  findChild(
    bookId: string,
    parentId: string,
    choiceIndex: number,
  ): Promise<Page | undefined>;
  savePage(bookId: string, page: Page): Promise<void>;
  getState(bookId: string): Promise<BookState | undefined>;
  saveState(bookId: string, state: BookState): Promise<void>;
}

/** Follows the parent links from a page back to the first page. */
export async function getPath(
  store: BookStore,
  bookId: string,
  pageId: string,
): Promise<Page[]> {
  const path: Page[] = [];
  let id: string | null = pageId;
  while (id) {
    const page = await store.getPage(bookId, id);
    if (!page) throw new Error(`Page ${id} of book ${bookId} not found`);
    path.unshift(page);
    id = page.parentId;
  }
  return path;
}
