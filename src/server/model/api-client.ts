import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import type { Effort, ModelClient, ModelRequest } from './model-client.js';
import { ModelError } from './model-client.js';

export interface ApiClientOptions {
  model: string;
  effort: Effort;
  client?: Anthropic;
}

/** Calls the Claude API with `ANTHROPIC_API_KEY`. */
export class ApiModelClient implements ModelClient {
  private readonly client: Anthropic;

  constructor(private readonly options: ApiClientOptions) {
    this.client = options.client ?? new Anthropic();
  }

  async generate<T>(request: ModelRequest<T>): Promise<T> {
    const format = betaZodOutputFormat(request.schema);
    const lastBlock = request.blocks.length - 1;
    const started = Date.now();
    const message = await this.client.beta.messages
      .stream({
        model: this.options.model,
        max_tokens: 32000,
        // If the model declines, for example on a grim scene, the API reruns
        // the request on the fallback model that fits the reason.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: request.effort ?? this.options.effort,
          format: { type: 'json_schema', schema: format.schema },
        },
        system: [
          {
            type: 'text',
            text: request.system,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: request.blocks.map((text, i) =>
              i === lastBlock
                ? { type: 'text', text, cache_control: { type: 'ephemeral' } }
                : { type: 'text', text },
            ),
          },
        ],
      })
      .finalMessage();

    const u = message.usage;
    console.log(
      `[api] ${request.purpose}: ${Date.now() - started} ms, model ${message.model}, ` +
        `input ${u.input_tokens}, cache read ${u.cache_read_input_tokens ?? 0}, ` +
        `cache write ${u.cache_creation_input_tokens ?? 0}, output ${u.output_tokens}`,
    );

    if (message.stop_reason === 'refusal') {
      throw new ModelError(
        `Claude declined to write this (${message.stop_details?.category ?? 'no category'})`,
      );
    }
    if (message.stop_reason === 'max_tokens') {
      throw new ModelError('The answer from Claude was cut off');
    }
    const text = message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('');
    return parseOutput(text, request);
  }
}

export function parseOutput<T>(text: string, request: ModelRequest<T>): T {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ModelError(`${request.purpose}: the answer was not JSON`);
  }
  const result = request.schema.safeParse(json);
  if (!result.success) {
    throw new ModelError(
      `${request.purpose}: the answer did not match the schema: ${result.error.message}`,
    );
  }
  return result.data;
}
