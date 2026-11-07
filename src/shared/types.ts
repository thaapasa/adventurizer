export const languages = ['en', 'fi'] as const;
export type Language = (typeof languages)[number];

export interface BookSettings {
  language: Language;
  genre: string;
  style: string;
  artStyle: string;
  author: string | null;
}

export interface WorldEntity {
  name: string;
  description: string;
  /** Short visual description that the image prompts reuse word for word. */
  looks: string;
}

/** The world as it is at the start of the book, shared by all branches. */
export interface World {
  people: WorldEntity[];
  places: WorldEntity[];
  details: string[];
}

export interface Book {
  id: string;
  title: string;
  createdAt: string;
  settings: BookSettings;
  world: World;
  firstPageId: string;
}

export interface Page {
  id: string;
  /** Null for the first page of the book. */
  parentId: string | null;
  /** Index of the action on the parent page that led here. */
  choiceIndex: number | null;
  choice: string | null;
  text: string;
  /** An empty list means the page is a dead end. */
  actions: string[];
  imagePrompt: string;
  /** What changed in the world on this page. Seen only on paths through it. */
  worldChanges: string[];
  createdAt: string;
}

export interface BookSummary {
  id: string;
  title: string;
  createdAt: string;
  settings: BookSettings;
}

export interface AuthorSuggestion {
  name: string;
  note: string;
}

export interface BookResponse {
  book: Book;
  currentPageId: string;
}

export interface PageResponse {
  page: Page;
  /** Page number on the path, starting from 1. */
  depth: number;
  /** For each action, whether the page it leads to has been written. */
  written: boolean[];
}

export interface CreateBookResponse {
  book: Book;
}

export interface ErrorResponse {
  error: string;
}
