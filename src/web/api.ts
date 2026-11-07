import type {
  AuthorSuggestion,
  BookResponse,
  BookSettings,
  BookSummary,
  CreateBookResponse,
  ErrorResponse,
  Language,
  PageResponse,
} from '../shared/types.js';

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(error?.error ?? `${res.status} ${res.statusText}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  listBooks: () => request<BookSummary[]>('GET', '/api/books'),
  createBook: (settings: BookSettings) =>
    request<CreateBookResponse>('POST', '/api/books', settings),
  getBook: (bookId: string) =>
    request<BookResponse>('GET', `/api/books/${bookId}`),
  getPage: (bookId: string, pageId: string) =>
    request<PageResponse>('GET', `/api/books/${bookId}/pages/${pageId}`),
  choose: (bookId: string, pageId: string, choiceIndex: number) =>
    request<PageResponse>(
      'POST',
      `/api/books/${bookId}/pages/${pageId}/choose`,
      { choiceIndex },
    ),
  setPosition: (bookId: string, pageId: string) =>
    request<void>('PUT', `/api/books/${bookId}/position`, { pageId }),
  suggestAuthors: (language: Language, genre: string, style: string) =>
    request<{ authors: AuthorSuggestion[] }>(
      'POST',
      '/api/suggestions/authors',
      { language, genre, style },
    ),
};
