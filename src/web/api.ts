import type {
  AuthorSuggestion,
  BookPitch,
  BookResponse,
  BookSummary,
  CreateBookRequest,
  CreateBookResponse,
  ErrorResponse,
  Language,
  PageResponse,
  PitchRequest,
  RegenerateImageResponse,
  ToneSuggestions,
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
  writePitch: (req: PitchRequest) =>
    request<BookPitch>('POST', '/api/pitch', req),
  createBook: (req: CreateBookRequest) =>
    request<CreateBookResponse>('POST', '/api/books', req),
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
  regenerateImage: async (bookId: string, imageId: string) => {
    const res = await request<RegenerateImageResponse>(
      'POST',
      `/api/books/${bookId}/images/${imageId}/regenerate`,
    );
    imageVersions.set(`${bookId}/${imageId}`, Date.now());
    return res;
  },
  suggestAuthors: (language: Language, genre: string, style: string) =>
    request<{ authors: AuthorSuggestion[] }>(
      'POST',
      '/api/suggestions/authors',
      { language, genre, style },
    ),
  suggestTone: (language: Language, genre: string, style: string) =>
    request<ToneSuggestions>('POST', '/api/suggestions/tone', {
      language,
      genre,
      style,
    }),
};

/**
 * When an image is made again, its URL gets a new version, because the browser
 * would otherwise show the old image that it has already loaded.
 */
const imageVersions = new Map<string, number>();

/** `imageId` is a page ID, or `cover` for the cover of the book. */
export function imageUrl(bookId: string, imageId: string): string {
  const version = imageVersions.get(`${bookId}/${imageId}`);
  const url = `/api/books/${bookId}/images/${imageId}`;
  return version ? `${url}?v=${version}` : url;
}
