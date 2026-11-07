# Story loop

The book is written one page at a time by an agent that uses the Claude API. The
player reads a page, picks an action, and the agent writes the next page.

## Pages

- [ ] Each page has the text of what happens next and a list of actions the
      player can choose from.
- [ ] The player picks one of the actions, and the book shows the page that
      follows from it.
- [ ] A page can be a dead end with no actions. The story does not have to
      continue from every page.

## Context

- [ ] When the agent writes a page, it knows the story so far on the current
      path.
- [ ] When the story so far gets too long, the agent condenses the older part
      into a summary and keeps writing from it.
- [ ] The agent uses the [world data](world-data.md), so the story stays
      consistent after it has been condensed.

## Open questions

- Does the book have game rules, such as stats, items and dice, or only story
  choices?
- Can the player type their own action, or only pick from the list?
- Is the story written fully as the player goes, or is there a plot outline and
  endings made at the start?
