# Architecture

The requirements are in [specs](specs/README.md). This file describes how the
parts fit together.

## Parts

- A Node server calls the Claude API and stores the books. The API key stays on
  the server.
- A Vite and React front end shows the books in the browser and calls the server
  through `/api`.

## Story loop

An agent loop writes the book one page at a time. For each page, the agent gets
the story so far and the world data, and writes what happens next and the
actions the player can choose from. The player picks an action and the loop runs
again.

The agent gets the full text of the current path, not the whole book. A path
only grows at the end, so prompt caching covers the earlier pages. If a path
gets too long for the context, the loop condenses the older part into a summary.
The first version does not condense.

## Book tree

The book is a tree of pages. Each page is saved together with the choice that
led to it, so the path of choices from the start identifies a page.

- If the player makes a choice that has a saved page, the book shows the saved
  page and does not call Claude.
- If the choice is new, the loop writes a new page, which starts a new branch.

This makes a book replayable, lets the player go back, and makes it possible to
play a book offline once its pages exist.

## World data

The agent keeps data about the people, places and other details of the story, so
that they stay consistent across branches and after the story is condensed. The
data has two layers:

- The shared base: the world as it is at the start of the book. All branches use
  the same base.
- The branch changes: what has happened on the current path, such as a person
  who died or a place that burned down. A page sees the base plus the changes on
  its own path.

## Storage

The books are files on disk, one folder per book:

- `book.json`: the settings and the shared base of the world data
- `pages/<page-id>.json`: one page, with the ID of the parent page, the choice
  that led to it, the text, the actions, the image prompt and the world changes
- `images/<page-id>.png`: the image of a page, if there is one

To build the world data for a page, the server follows the parent links back to
the first page. The storage is behind an interface, so it can move to SQLite if
files get awkward. Embeddings are not needed, because the world data of one book
fits in the context.

## Images

The agent writes an image prompt for each page from the art style of the book
and the visual descriptions in the world data. The user can make the image in
Draw Things and save it in `images/`. Later the server can call the HTTP API of
Draw Things directly.
