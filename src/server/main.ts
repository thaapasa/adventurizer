import { existsSync } from 'node:fs';
import path from 'node:path';

import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { readConfig } from './config.js';
import { ApiModelClient } from './model/api-client.js';
import { ClaudeCodeModelClient } from './model/claude-code-client.js';
import type { ModelClient } from './model/model-client.js';
import { FileBookStore } from './store/file-book-store.js';
import { StoryService } from './story/story-service.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const config = readConfig(process.env);

const model: ModelClient =
  config.backend === 'api'
    ? new ApiModelClient({ model: config.model, effort: config.effort })
    : new ClaudeCodeModelClient({
        model: config.model,
        effort: config.effort,
        command: config.claudeCommand,
      });

const store = new FileBookStore(path.resolve(config.booksDir));
const app = createApp(new StoryService(store, model));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(
    `Adventurizer API on http://localhost:${info.port}, ` +
      `backend ${config.backend}, model ${config.model}, effort ${config.effort}, ` +
      `books in ${path.resolve(config.booksDir)}`,
  );
});
