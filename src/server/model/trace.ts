import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The files of one call to Claude. Every file of a call starts with the same
 * time stamp and action, such as `20261107T142530.123Z-page-4`, so the files
 * of a call sort next to each other.
 */
export interface Trace {
  /** Writes `<prefix>.<name>`. Data that is not a string is written as JSON. */
  write(name: string, data: unknown): Promise<void>;
}

export interface Tracer {
  /** Starts the trace of one call. Calls outside a book have no book ID. */
  start(bookId: string | null, action: string): Trace;
}

/**
 * Writes the traces of a book in its `trace` folder, and the traces of calls
 * outside a book, such as the author suggestions, in `.trace` of the books
 * folder.
 */
export class FileTracer implements Tracer {
  constructor(private readonly booksDir: string) {}

  start(bookId: string | null, action: string): Trace {
    const dir = bookId
      ? path.join(this.booksDir, bookId, 'trace')
      : path.join(this.booksDir, '.trace');
    const stamp = new Date().toISOString().replace(/[-:]/g, '');
    const prefix = path.join(dir, `${stamp}-${action}`);
    return {
      async write(name, data) {
        // A trace is for debugging, so failing to write one must not fail
        // the call to Claude.
        try {
          await mkdir(dir, { recursive: true });
          const text =
            typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          await writeFile(`${prefix}.${name}`, text, 'utf8');
        } catch (e) {
          console.error(`Could not write the trace ${prefix}.${name}:`, e);
        }
      },
    };
  }
}
