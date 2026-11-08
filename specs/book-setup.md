# Book setup

When the user creates a [book](books.md), they first pick its settings. Then
they describe the idea of the book, and the agent writes a title and a blurb:
the text on the back cover that tells a reader what the book is about. The user
and the agent iterate on the blurb until the user accepts it. The agent then
writes a hidden plan for the story and the first page.

## Steps

- [ ] The user creates a book in these steps:
  1. Pick the language.
  2. Pick the genre, the style, the author style, the art style, the
     [tone](books.md#tone) and the [length](books.md#length).
  3. Write the idea of the book.
  4. Iterate on the title and the blurb with the agent.
  5. Accept the title and the blurb. The agent creates the book.
- [ ] The user can go back to an earlier step and change it before the book is
      created.

## Idea

- [ ] The user writes the idea of the book as free text. It can be one line or
      several paragraphs.
- [ ] A "surprise me" button lets the agent come up with the idea.

## Title and blurb

- [ ] From the settings and the idea, the agent writes a title and a blurb for
      the book. The blurb is about 80 to 150 words, in the language of the book.
- [ ] The user can edit the title and the blurb directly.
- [ ] The user can write comments on the blurb, such as "less silly, and the
      dragon should be the villain", and ask for a new version.
- [ ] When the user asks for a new version, the agent gets the current title and
      blurb, with the user's edits, and the comments.
- [ ] The user can iterate as many times as they want.

## Creating the book

- [ ] When the user accepts the title and the blurb, the agent writes the
      [world data](world-data.md), the [story plan](story-loop.md#story-plan),
      the cover prompt and the first page from them.
- [ ] The title and the blurb are saved with the book and cannot be changed
      after it is created.
