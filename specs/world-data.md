# World data

The agent keeps data about the people, places and other details of the story, so
that they are used correctly in every branch and after the story so far has been
condensed.

## Shared base

- [x] A book has a shared base: the people, places and details as they are at
      the start. All branches use the same base.
- [x] A detail in the base, such as the name or the looks of a person, stays the
      same on every path.

## Visual descriptions

- [x] Each person and place in the world data has a short visual description.
- [x] [Image](images.md) prompts use these descriptions, so a person or place
      looks the same on every page.

## Branch changes

- [x] Each path keeps its own record of what has happened, such as a person who
      died or became the player's ally.
- [x] A page uses the shared base together with the changes on its own path. A
      change on one branch does not show on another branch.
