import { beforeEach, describe, expect, it } from 'vitest';

import { FileBookStore } from '../store/file-book-store.js';
import { FakeImageGenerator, tempDir } from '../test-helpers.js';
import { ImageService } from './image-service.js';

describe('ImageService', () => {
  let store: FileBookStore;
  let generator: FakeImageGenerator;
  let now: number;
  let images: ImageService;

  beforeEach(async () => {
    store = new FileBookStore(await tempDir());
    generator = new FakeImageGenerator();
    now = 0;
    images = new ImageService(store, generator, {
      retryAfterMs: 1000,
      now: () => now,
    });
  });

  it('makes a missing image and saves it in the book', async () => {
    expect(await images.request('b1', 'p1', 'A lantern')).toBe('pending');
    await images.whenIdle();
    expect(await images.request('b1', 'p1', 'A lantern')).toBe('ready');
    expect((await store.getImage('b1', 'p1'))?.toString()).toBe('A lantern');
    expect(generator.prompts).toEqual(['A lantern']);
  });

  it('makes the latest request first and each image once', async () => {
    await images.request('b1', 'p1', 'one');
    await images.request('b1', 'p2', 'two');
    await images.request('b1', 'p3', 'three');
    await images.request('b1', 'p2', 'two');
    await images.whenIdle();
    // p1 started before the others were queued.
    expect(generator.prompts).toEqual(['one', 'two', 'three']);
  });

  it('tries a failed image again only after a while', async () => {
    generator.failing = true;
    await images.request('b1', 'p1', 'one');
    await images.whenIdle();
    generator.failing = false;
    expect(await images.request('b1', 'p1', 'one')).toBe('none');
    now = 1000;
    expect(await images.request('b1', 'p1', 'one')).toBe('pending');
    await images.whenIdle();
    expect(await store.hasImage('b1', 'p1')).toBe(true);
  });

  it('shows a saved image when no generator is set', async () => {
    const off = new ImageService(store, undefined);
    expect(await off.request('b1', 'p1', 'one')).toBe('none');
    await store.saveImage('b1', 'p1', Buffer.from('png'));
    expect(await off.request('b1', 'p1', 'one')).toBe('ready');
  });
});
