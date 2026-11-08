# Books

The app holds several books. Each book is a separate story with its own
settings, so the app can write different kinds of books.

## Choosing a book

- [x] At the start, the user picks a book from the list of books, or creates a
      new one.
- [x] If the user opens a book, the adventure continues in that book.
- [x] The books are separate. Pages, [world data](world-data.md) and the
      [book tree](book-tree.md) of one book do not affect another book.

## Book settings

- [x] When creating a book, the user picks its language first. The rest of the
      form and the suggestions for it are in that language.
- [x] When creating a book, the user picks its genre, such as fantasy or science
      fiction.
- [x] The user picks the style of the book, such as easy-going, grimdark or
      young adult.
- [x] The user can type in any genre and style, or pick one of the suggestions.
- [x] The user picks the language of the book: English or Finnish. The language
      cannot be changed after the book is created.
- [x] The agent writes the pages and the actions in the language of the book.

- [x] The user picks an art style for the [images](images.md) of the book.

## Author style

- [x] When creating a book, the user can pick an author whose style the agent
      tries to imitate. The author is optional.
- [x] The app suggests authors that fit the language, genre and style of the
      book.
- [x] The user can type in any author, or a mix such as "Joe Abercrombie meets
      Terry Pratchett". The suggestions are only examples.

## Tone

The tone settings tell the agent how the book should feel, so it does not have
to guess from the genre and the style alone.

- [ ] The user sets how realistic the world is, such as grounded, a little odd
      or absurd.
- [ ] The user sets the target reader, such as children, young adults or adults.
- [ ] The user sets how dark the story can get, such as light, some danger or
      grim.
- [ ] The agent suggests values for each tone setting that fit the language,
      genre and style of the book. The user can type in anything instead.

## Length

- [ ] The user picks the length of the book: short, medium or long. The length
      is the number of pages on a path before the story reaches an ending:
  - short: about 10 to 15 pages
  - medium: about 20 to 30 pages
  - long: about 40 to 60 pages

## Idea, blurb and title

Before the book is created, the user and the agent agree on what the book is
about. See [book setup](book-setup.md) for the steps.
