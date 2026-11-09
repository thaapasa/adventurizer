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

- [x] The user can see the image prompt of a page, run it in Draw Things and
      save the image in the folder of the book. The reader then shows it.
- [x] The app can send the prompt to the HTTP API of Draw Things and save the
      image by itself.
- [x] The images are square, 1024 × 1024 pixels.
- [x] The app makes the image of a page or a cover when the user first sees it,
      so the books made before the images get their images too.
- [x] While an image is being made, the reader says so and shows the image when
      it is ready.
- [x] If Draw Things is not running, the book works without images, and the app
      tries again later.
- [x] The user can make a new image for a page or a cover from the reader. The
      app deletes the old image and makes a new one from the same prompt, for
      example to try another model in Draw Things.

## Cover

- [x] When the agent creates a book, it writes an image prompt for the cover.
- [x] The books made before covers use the image prompt of page 1 for the cover.
- [x] The book list shows the cover of each book as a thumbnail.
