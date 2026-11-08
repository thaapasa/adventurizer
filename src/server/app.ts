import { type Context, Hono } from 'hono';
import { z } from 'zod';

import {
  type Book,
  bookLengths,
  type BookPitch,
  type BookResponse,
  type BookSummary,
  type CreateBookResponse,
  type ImageStatus,
  languages,
  type Page,
  type PageResponse,
  type ToneSuggestions,
} from '../shared/types.js';
import type { ImageService } from './images/image-service.js';
import { ModelError } from './model/model-client.js';
import { isValidId } from './store/file-book-store.js';
import { NotFoundError, type StoryService } from './story/story-service.js';

const text = z.string().trim().min(1).max(200);

const optionalText = z.string().trim().max(200);

const settingsSchema = z.object({
  language: z.enum(languages),
  genre: text,
  style: text,
  realism: optionalText,
  audience: optionalText,
  darkness: optionalText,
  artStyle: text,
  author: optionalText
    .nullable()
    .optional()
    .transform((a) => a || null),
  length: z.enum(bookLengths),
});

/** Empty text counts as no idea, which lets the agent come up with one. */
const ideaSchema = z
  .string()
  .trim()
  .max(4000)
  .nullable()
  .transform((i) => i || null);

const pitchSchema = z.object({
  title: text,
  blurb: z.string().trim().min(1).max(4000),
});

const pitchRequestSchema = z.object({
  settings: settingsSchema,
  idea: ideaSchema,
  current: pitchSchema.optional(),
  comments: z.string().trim().max(4000).optional(),
});

const createBookSchema = pitchSchema.extend({
  settings: settingsSchema,
  idea: ideaSchema,
});

const chooseSchema = z.object({ choiceIndex: z.number().int().min(0) });

const positionSchema = z.object({ pageId: z.string() });

const genreSchema = z.object({
  language: z.enum(languages),
  genre: text,
  style: text,
});

class BadRequestError extends Error {}

/** Reads an ID from the URL. IDs become part of file paths, so they are checked. */
function idParam(c: Context, name: string): string {
  const id = c.req.param(name);
  if (!id || !isValidId(id)) throw new BadRequestError();
  return id;
}

export function createApp(story: StoryService, images: ImageService): Hono {
  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof NotFoundError)
      return c.json({ error: err.message }, 404);
    if (
      err instanceof z.ZodError ||
      err instanceof BadRequestError ||
      err instanceof SyntaxError
    ) {
      return c.json({ error: 'Invalid request' }, 400);
    }
    console.error(err);
    if (err instanceof ModelError) return c.json({ error: err.message }, 502);
    return c.json({ error: 'Something went wrong on the server' }, 500);
  });

  /** Returns the status of the cover and queues it if it is missing. */
  const requestCover = async (book: Book) =>
    images.request(book.id, 'cover', await story.getCoverPrompt(book));

  const requestPageImage = (bookId: string, page: Page) =>
    images.request(bookId, page.id, page.imagePrompt);

  app.get('/api/books', async (c) => {
    const books = await story.listBooks();
    // The queue makes the latest request first, so the covers are requested
    // from the bottom of the list up, and the covers at the top come first.
    const covers = new Map<string, ImageStatus>();
    for (const book of [...books].reverse()) {
      covers.set(book.id, await requestCover(book));
    }
    return c.json(
      books.map((b): BookSummary => ({
        id: b.id,
        title: b.title,
        createdAt: b.createdAt,
        settings: b.settings,
        cover: covers.get(b.id) ?? 'none',
      })),
    );
  });

  app.post('/api/books', async (c) => {
    const book = await story.createBook(
      createBookSchema.parse(await c.req.json()),
    );
    return c.json({ book } satisfies CreateBookResponse, 201);
  });

  app.get('/api/books/:bookId', async (c) => {
    const book = await story.getBook(idParam(c, 'bookId'));
    const currentPageId = await story.getCurrentPageId(book);
    // The reader sees the cover first and page 1 next. When the queue is
    // empty, the first request starts at once and the second one waits.
    const cover = await requestCover(book);
    await requestPageImage(
      book.id,
      await story.getPage(book.id, book.firstPageId),
    );
    return c.json({ book, currentPageId, cover } satisfies BookResponse);
  });

  app.put('/api/books/:bookId/position', async (c) => {
    const { pageId } = positionSchema.parse(await c.req.json());
    if (!isValidId(pageId)) throw new BadRequestError();
    await story.setCurrentPage(idParam(c, 'bookId'), pageId);
    return c.body(null, 204);
  });

  app.get('/api/books/:bookId/pages/:pageId', async (c) => {
    const bookId = idParam(c, 'bookId');
    const page = await story.getPage(bookId, idParam(c, 'pageId'));
    const info = await story.describePage(bookId, page);
    const image = await requestPageImage(bookId, page);
    return c.json({ page, ...info, image } satisfies PageResponse);
  });

  /** `imageId` is a page ID, or `cover` for the cover of the book. */
  app.get('/api/books/:bookId/images/:imageId', async (c) => {
    const png = await images.getImage(
      idParam(c, 'bookId'),
      idParam(c, 'imageId'),
    );
    if (!png) return c.json({ error: 'Image not found' }, 404);
    return c.body(new Uint8Array(png), 200, { 'Content-Type': 'image/png' });
  });

  app.post('/api/books/:bookId/pages/:pageId/choose', async (c) => {
    const bookId = idParam(c, 'bookId');
    const { choiceIndex } = chooseSchema.parse(await c.req.json());
    const { page } = await story.choose(
      bookId,
      idParam(c, 'pageId'),
      choiceIndex,
    );
    const info = await story.describePage(bookId, page);
    const image = await requestPageImage(bookId, page);
    return c.json({ page, ...info, image } satisfies PageResponse);
  });

  app.post('/api/pitch', async (c) => {
    const pitch = await story.writePitch(
      pitchRequestSchema.parse(await c.req.json()),
    );
    return c.json(pitch satisfies BookPitch);
  });

  app.post('/api/suggestions/tone', async (c) => {
    const body = genreSchema.parse(await c.req.json());
    const tone = await story.suggestTone(body.language, body.genre, body.style);
    return c.json(tone satisfies ToneSuggestions);
  });

  app.post('/api/suggestions/authors', async (c) => {
    const body = genreSchema.parse(await c.req.json());
    const authors = await story.suggestAuthors(
      body.language,
      body.genre,
      body.style,
    );
    return c.json({ authors });
  });

  return app;
}
