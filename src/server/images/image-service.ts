import type { ImageStatus } from '../../shared/types.js';
import type { BookStore } from '../store/book-store.js';

export interface ImageGenerator {
  /** Returns the image as PNG. */
  generate(prompt: string): Promise<Buffer>;
}

export interface ImageServiceOptions {
  /** How long to wait before trying a failed image again. */
  retryAfterMs?: number;
  now?: () => number;
}

interface Job {
  key: string;
  bookId: string;
  imageId: string;
  prompt: string;
}

/**
 * Makes the missing images of the books, one at a time, because Draw Things
 * makes one image at a time anyway. An image is queued when the reader asks
 * for it, and the latest request goes first, so the page that the reader is
 * on gets its image before the older requests.
 */
export class ImageService {
  /** Waiting jobs. The last one runs next. */
  private readonly queue: Job[] = [];
  /** The keys of the waiting jobs and the running job. */
  private readonly pending = new Set<string>();
  private readonly failedAt = new Map<string, number>();
  private running = false;
  private worker: Promise<void> = Promise.resolve();

  private readonly retryAfterMs: number;
  private readonly now: () => number;

  constructor(
    private readonly store: BookStore,
    private readonly generator: ImageGenerator | undefined,
    options: ImageServiceOptions = {},
  ) {
    this.retryAfterMs = options.retryAfterMs ?? 60_000;
    this.now = options.now ?? Date.now;
  }

  get enabled(): boolean {
    return this.generator !== undefined;
  }

  /**
   * Returns the status of an image and queues it if it is missing. If it is
   * already queued, it moves to the front of the queue.
   */
  async request(
    bookId: string,
    imageId: string,
    prompt: string,
  ): Promise<ImageStatus> {
    if (await this.store.hasImage(bookId, imageId)) return 'ready';
    if (!this.generator) return 'none';

    const key = `${bookId}/${imageId}`;
    if (this.pending.has(key)) {
      const index = this.queue.findIndex((job) => job.key === key);
      if (index >= 0) this.queue.push(...this.queue.splice(index, 1));
      return 'pending';
    }
    const failed = this.failedAt.get(key);
    if (failed !== undefined && this.now() - failed < this.retryAfterMs) {
      return 'none';
    }

    this.pending.add(key);
    this.queue.push({ key, bookId, imageId, prompt });
    if (!this.running) {
      this.running = true;
      this.worker = this.work();
    }
    return 'pending';
  }

  getImage(bookId: string, imageId: string): Promise<Buffer | undefined> {
    return this.store.getImage(bookId, imageId);
  }

  /** Resolves when the queue is empty. */
  async whenIdle(): Promise<void> {
    while (this.running) await this.worker;
  }

  private async work(): Promise<void> {
    for (let job = this.queue.pop(); job; job = this.queue.pop()) {
      try {
        const png = await this.generator!.generate(job.prompt);
        await this.store.saveImage(job.bookId, job.imageId, png);
        this.failedAt.delete(job.key);
      } catch (e) {
        this.failedAt.set(job.key, this.now());
        console.warn(`Image ${job.key} failed: ${(e as Error).message}`);
      } finally {
        this.pending.delete(job.key);
      }
    }
    // Cleared in the same step as the last empty pop, so that a job queued
    // after it starts a new worker.
    this.running = false;
  }
}
