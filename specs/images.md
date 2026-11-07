# Images

Each page can have one image. The agent writes a prompt for an image generator,
and the image is made with Draw Things, which runs on the user's machine.

## Prompts

- [x] The agent writes an image prompt for each page and saves it with the page.
- [x] The prompt uses the art style of the [book](books.md), so the images of a
      book look alike.
- [x] The prompt uses the visual descriptions in the
      [world data](world-data.md), so people and places look the same on every
      page.

## Making the images

- [ ] The user can see the image prompt of a page, run it in Draw Things and
      save the image in the folder of the book. The reader then shows it.
- [ ] The app can send the prompt to the HTTP API of Draw Things and save the
      image by itself.

## Open questions

- Which size and aspect ratio do the images use?
