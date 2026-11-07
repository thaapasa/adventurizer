# Adventurizer

An adventure book that Claude writes while you play it. Like the gamebooks of
the 1980s, you read a page, pick what to do next, and the book continues from
your choice. Every page is saved, so you can go back, try another choice, and
replay a path the same way later.

The project is in the planning stage. The requirements are in
[specs](specs/README.md), and the design is in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Development

The tools are managed with [mise](https://mise.jdx.dev/). `mise install`
installs Node and the npm dependencies.

- `npm run lint`: ESLint
- `npm run format`: format all files with Prettier
- `npm run typecheck`: TypeScript type check
- `npm test`: Vitest

### Local ports

The app ID in the shared port scheme is `06`. The API server will use port 10600
and the Vite dev server port 10610.
