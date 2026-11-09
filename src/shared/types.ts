export const languages = ['en', 'fi'] as const;
export type Language = (typeof languages)[number];

export const bookLengths = ['short', 'medium', 'long'] as const;
export type BookLength = (typeof bookLengths)[number];

/** The number of pages on a path before it reaches an ending. */
export const lengthPages: Record<BookLength, [number, number]> = {
  short: [10, 15],
  medium: [20, 30],
  long: [40, 60],
};

export interface Tone {
  /** How realistic the world is, such as grounded or absurd. */
  realism: string;
  /** The target reader, such as children or adults. */
  audience: string;
  /** How dark the story can get. */
  darkness: string;
}

export interface BookSettings extends Tone {
  language: Language;
  genre: string;
  style: string;
  artStyle: string;
  author: string | null;
  length: BookLength;
}

/** What the user and the agent agree on before the book is created. */
export interface BookPitch {
  title: string;
  blurb: string;
}

/**
 * The hidden plan that keeps the story focused. It lists goals rather than
 * an order of events, so that it works with any path through the book.
 */
export interface StoryPlan {
  /** The secrets and what is really going on behind the blurb. */
  truth: string;
  /** Milestones that a path can reach in any order. Pages refer to them by number. */
  milestones: string[];
  endings: string[];
  toneRules: string[];
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
  /** The idea that the user wrote, or null if the agent came up with it. */
  idea: string | null;
  blurb: string;
  plan: StoryPlan;
  world: World;
  firstPageId: string;
  /** Missing in books made before covers; the cover then uses page 1. */
  coverPrompt?: string;
}

/**
 * Whether an image exists. `pending` means it is being made or waits in the
 * queue; `none` means it is not there and is not being made.
 */
export type ImageStatus = 'ready' | 'pending' | 'none';

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
  /** The numbers of the plan milestones that the path reached on this page. */
  milestones: number[];
  createdAt: string;
}

export interface BookSummary {
  id: string;
  title: string;
  createdAt: string;
  settings: BookSettings;
  cover: ImageStatus;
}

export interface AuthorSuggestion {
  name: string;
  note: string;
}

export interface ToneSuggestions {
  realism: string[];
  audience: string[];
  darkness: string[];
}

export interface PitchRequest {
  settings: BookSettings;
  /** Null lets the agent come up with the idea. */
  idea: string | null;
  /** The current version with the user's edits, when asking for a new one. */
  current?: BookPitch;
  comments?: string;
}

export interface CreateBookRequest extends BookPitch {
  settings: BookSettings;
  idea: string | null;
}

export interface BookResponse {
  book: Book;
  currentPageId: string;
  cover: ImageStatus;
}

export interface PageResponse {
  page: Page;
  /** Page number on the path, starting from 1. */
  depth: number;
  /** For each action, whether the page it leads to has been written. */
  written: boolean[];
  image: ImageStatus;
}

export interface RegenerateImageResponse {
  image: ImageStatus;
}

export interface CreateBookResponse {
  book: Book;
}

export interface ErrorResponse {
  error: string;
}
