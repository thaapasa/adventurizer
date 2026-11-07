import { type Context, Hono } from 'hono';
import { z } from 'zod';

import {
  type BookResponse,
  type BookSummary,
  type CreateBookResponse,
  languages,
  type PageResponse,
} from '../shared/types.js';
import { ModelError } from './model/model-client.js';
import { isValidId } from './store/file-book-store.js';
import { NotFoundError, type StoryService } from './story/story-service.js';

const text = z.string().trim().min(1).max(200);

const createBookSchema = z.object({
  language: z.enum(languages),
  genre: text,
  style: text,
  artStyle: text,
  author: z.string().trim().max(200).nullable().optional(),
});

const chooseSchema = z.object({ choiceIndex: z.number().int().min(0) });

const positionSchema = z.object({ pageId: z.string() });

const authorsSchema = z.object({
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

export function createApp(story: StoryService): Hono {
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

  app.get('/api/books', async (c) => {
    const books = await story.listBooks();
    return c.json(
      books.map((b): BookSummary => ({
        id: b.id,
        title: b.title,
        createdAt: b.createdAt,
        settings: b.settings,
      })),
    );
  });

  app.post('/api/books', async (c) => {
    const body = createBookSchema.parse(await c.req.json());
    const book = await story.createBook({
      ...body,
      author: body.author || null,
    });
    return c.json({ book } satisfies CreateBookResponse, 201);
  });

  app.get('/api/books/:bookId', async (c) => {
    const book = await story.getBook(idParam(c, 'bookId'));
    const currentPageId = await story.getCurrentPageId(book);
    return c.json({ book, currentPageId } satisfies BookResponse);
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
    return c.json({ page, ...info } satisfies PageResponse);
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
    return c.json({ page, ...info } satisfies PageResponse);
  });

  app.post('/api/suggestions/authors', async (c) => {
    const body = authorsSchema.parse(await c.req.json());
    const authors = await story.suggestAuthors(
      body.language,
      body.genre,
      body.style,
    );
    return c.json({ authors });
  });

  return app;
}
