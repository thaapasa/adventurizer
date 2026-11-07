import { randomInt } from 'node:crypto';

import { z } from 'zod';

import type { ImageGenerator } from './image-service.js';

const responseSchema = z.object({ images: z.array(z.string()).min(1) });

/**
 * Makes images with the HTTP API of Draw Things, which copies the txt2img call
 * of the Automatic1111 API. The request sends only the prompt, the size and a
 * seed, so the model, the sampler and the steps come from the settings of the
 * app.
 */
export class DrawThingsClient implements ImageGenerator {
  constructor(
    private readonly url: string,
    private readonly size: number,
  ) {}

  async generate(prompt: string): Promise<Buffer> {
    const res = await fetch(new URL('/sdapi/v1/txt2img', this.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        width: this.size,
        height: this.size,
        // Without a seed, Draw Things uses the seed in its settings, which
        // can be fixed.
        seed: randomInt(2 ** 31),
      }),
    });
    if (!res.ok) {
      throw new Error(`Draw Things answered ${res.status} ${res.statusText}`);
    }
    const body = responseSchema.parse(await res.json());
    return Buffer.from(body.images[0]!, 'base64');
  }
}
