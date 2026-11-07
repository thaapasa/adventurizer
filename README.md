# Adventurizer

An adventure book that Claude writes while you play it. Like the gamebooks of
the 1980s, you read a page, pick what to do next, and the book continues from
your choice. Every page is saved, so you can go back, try another choice, and
replay a path the same way later.

The requirements are in [specs](specs/README.md), and the design is in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Development

The tools are managed with [mise](https://mise.jdx.dev/). `mise install`
installs Node and the npm dependencies.

### Running the app

1. Copy `.env.example` to `.env` and pick the backend that writes the pages:
   - `STORY_BACKEND=claude-code` (the default) runs the `claude` command, which
     must be installed and logged in.
   - `STORY_BACKEND=api` calls the Claude API and needs `ANTHROPIC_API_KEY`.
2. Run `npm run dev` and open http://localhost:10610.

The books are saved in `books/`, or in the folder that `BOOKS_DIR` names. The
server log shows the time, the tokens and the cache use of each call to Claude.

### Checks

- `npm run lint`: ESLint
- `npm run format`: format all files with Prettier
- `npm run typecheck`: TypeScript type check
- `npm test`: Vitest

### Local ports

The app ID in the shared port scheme is `06`. The API server uses port 10600 and
the Vite dev server port 10610.
