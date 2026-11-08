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
- [ ] Each page moves the story forward: something changes, is learned or is
      decided. A page does not just repeat the action the player picked in a
      slightly different form.
- [ ] A page has 3 to 5 actions. They lead to clearly different directions, so
      each choice matters.
- [ ] The actions are varied in kind, such as talking, fighting, sneaking,
      investigating or leaving, and are not all safe or all reckless.

## Story plan

When the agent creates a book, it writes a plan that keeps the story focused on
what the blurb promises. The plan is hidden from the player. It lists goals
rather than a fixed order of events, so it works with any path through the book.

- [ ] The plan has the truth behind the blurb: the secrets, what the antagonist
      wants and what is really going on.
- [ ] The plan has 3 to 5 milestones that a path can reach in any order, such as
      "the reader finds out who stole the crown".
- [ ] The plan has a few kinds of endings: good ones, failures and possibly a
      strange one.
- [ ] The plan has tone rules that follow from the
      [tone settings](books.md#tone), such as "the world is grounded and the
      humor comes from the people".
- [ ] When the agent writes a page, it gets the blurb and the plan.
- [ ] Each path keeps a record of the milestones it has reached.
- [ ] The agent paces the story by the [length](books.md#length) of the book and
      the milestones reached, and steers the path towards an ending when it gets
      near the length.
- [ ] The plan is saved in the files of the book, where a developer can read it.

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
- The pages are written as the player goes. The [story plan](#story-plan) guides
  them but does not fix the order of events.
