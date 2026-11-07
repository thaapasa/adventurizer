# Architecture

The requirements are in [specs](specs/README.md). This file describes how the
parts fit together.

## Story loop

An agent loop writes the book one page at a time. For each page, the agent gets
the story so far and the world data, and writes what happens next and the
actions the player can choose from. The player picks an action and the loop runs
again.

When the story so far gets too long for the context, the loop condenses the
older part into a summary.

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
