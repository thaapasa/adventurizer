# Story loop

The book is written one page at a time by an agent that uses the Claude API. The
player reads a page, picks an action, and the agent writes the next page.

## Pages

- [x] Each page has the text of what happens next and a list of actions the
      player can choose from.
- [x] The player picks one of the actions, and the book shows the page that
      follows from it.
- [x] A page can be a dead end with no actions. The story does not have to
      continue from every page.

## Context

- [x] When the agent writes a page, it gets the [world data](world-data.md) and
      the full text of the current path.
- [x] Each page also gets an [image](images.md) prompt.
- [ ] If a path gets too long for the context, the agent condenses the older
      part into a summary and keeps writing from it. The first version does not
      need this, because a path of dozens of pages fits in the context.

## Agent

- [x] The agent can run on the Claude API with an API key, or on the local
      Claude Code with its login.
- [x] The developer can pick the model. The first version uses Claude Opus 5.5.

## Decisions for now

These were decided for the first version and can be revisited:

- The book has only story choices, no game rules such as stats, items or dice.
- The player picks an action from the list and cannot type their own.
- The story is written fully as the player goes, without a plot outline or
  endings made at the start.
