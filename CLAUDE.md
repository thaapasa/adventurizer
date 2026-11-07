# Adventurizer

An adventure book that Claude writes page by page as the player makes choices.
See [README.md](README.md) for the overview and
[ARCHITECTURE.md](ARCHITECTURE.md) for the design.

## Tools

- Install tools and dependencies with `mise install`. Do not install system
  packages: the sandbox has to work with `mise install` alone.
- Node is pinned to 24, because the Node 26 builds for linux-arm64 need
  `libatomic1`, which the sandbox does not have.
- Before finishing a change, run `npm run lint`, `npm run format:check`,
  `npm run typecheck` and `npm test`. CI runs the same checks.

## Local ports

The app ID in the shared port scheme is `06`: 10600 for the API server and 10610
for the Vite dev server. Read `/Users/thaapasa/agents/shared/ports.md` before
adding a port.

## Specs

Requirements live in `specs/`, one file per app area. See `specs/README.md` for
the format.

- Read the relevant spec before planning or implementing a feature.
- Add new requirements as unchecked items (`- [ ]`).
- Format the specs with Prettier after editing them: `npm run format`.
- Tick a requirement (`- [x]`) in the same commit that implements it.
- Ask before changing or removing an existing requirement.
- Each spec can end with an "Open questions" section. Ask the user before you
  implement anything that depends on an open question.
