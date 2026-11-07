# Book tree

Every page is saved with the path of choices that led to it. Together the pages
form a tree, which grows as the player explores new choices.

## Replay

- [x] Each page of every turn is saved.
- [x] The player can restart a book. If they make the same choices, they get the
      same pages.
- [x] If the player makes a choice that has no saved page, the agent writes a
      new page and saves it.

## Going back

- [x] The player can go back to an earlier page and pick another action.

## Storage

- [x] Each book is stored as a folder of files on disk. A developer can read a
      book in an editor and copy it as one folder.

## Offline play

- [x] A book can be played without the Claude API, as far as its pages have been
      written.

Filling the whole tree in advance is possible but not a goal. The tree grows
fast, so a book is not expected to have every path written.
