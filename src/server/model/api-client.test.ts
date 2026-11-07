import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiModelClient } from './api-client.js';
import { ModelError } from './model-client.js';

const schema = z.object({ answer: z.number() });

function fakeSdk(message: object, sent: unknown[] = []): Anthropic {
  const sdk = {
    beta: {
      messages: {
        stream: (params: unknown) => {
          sent.push(params);
          return { finalMessage: async () => message };
        },
      },
    },
  };
  return sdk as unknown as Anthropic;
}

function message(text: string, stop_reason = 'end_turn') {
  return {
    model: 'claude-opus-5-5',
    stop_reason,
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

const request = {
  purpose: 'test',
  system: 'System prompt',
  blocks: ['one', 'two'],
  schema,
};

describe('ApiModelClient', () => {
  it('caches the system prompt and the blocks up to the last one', async () => {
    const sent: Record<string, unknown>[] = [];
    const client = new ApiModelClient({
      model: 'claude-opus-5-5',
      effort: 'medium',
      client: fakeSdk(message('{"answer":7}'), sent),
    });
    await expect(client.generate(request)).resolves.toEqual({ answer: 7 });

    const params = sent[0] as {
      fallbacks: string;
      output_config: { effort: string; format: { type: string } };
      system: { cache_control?: object }[];
      messages: { content: { text: string; cache_control?: object }[] }[];
    };
    expect(params.fallbacks).toBe('default');
    expect(params.output_config.effort).toBe('medium');
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.system[0]!.cache_control).toEqual({ type: 'ephemeral' });
    const content = params.messages[0]!.content;
    expect(content.map((c) => c.text)).toEqual(['one', 'two']);
    expect(content[0]!.cache_control).toBeUndefined();
    expect(content[1]!.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('traces the prompt, the request and the response', async () => {
    const files = new Map<string, unknown>();
    const answer = message('{"answer":7}');
    const client = new ApiModelClient({
      model: 'claude-opus-5-5',
      effort: 'medium',
      client: fakeSdk(answer),
    });
    await client.generate({
      ...request,
      trace: { write: async (name, data) => void files.set(name, data) },
    });
    expect([...files.keys()]).toEqual([
      'prompt.md',
      'request.json',
      'response.json',
    ]);
    expect(files.get('response.json')).toBe(answer);
  });

  it('fails on a refusal', async () => {
    const client = new ApiModelClient({
      model: 'claude-opus-5-5',
      effort: 'medium',
      client: fakeSdk(message('', 'refusal')),
    });
    await expect(client.generate(request)).rejects.toThrow(ModelError);
  });
});
