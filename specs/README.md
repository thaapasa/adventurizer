# Specs

Requirements for the app, one file per area. Agents use these files for feature
planning and implementation.

Each file has a heading, a short description of the area and a list of
requirements:

- `- [ ]` means planned.
- `- [x]` means implemented.

Keep requirements at the level of what a user or caller can do. Leave
implementation details to the code. When a requirement depends on another area,
link to that area's file.

A file can end with an "Open questions" section for decisions that are not made
yet.

After editing a spec, format it with Prettier: `npm run format`.

## Areas

- [Books](books.md): the list of books and the settings of each book, such as
  genre, style, language and author style.
- [Book setup](book-setup.md): the steps for creating a book, from the idea to
  the blurb and the hidden story plan.
- [Localization](localization.md): the app texts in English and Finnish.
- [Reader](reader.md): the browser view for reading a book and picking actions.
- [Images](images.md): an image for each page, made with Draw Things.
- [Story loop](story-loop.md): how the book writes the next page and the
  choices.
- [Book tree](book-tree.md): saving pages, replaying a path and going back.
- [World data](world-data.md): the people, places and events that keep the story
  consistent.
