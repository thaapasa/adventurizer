import type { Language } from '../shared/types.js';

const en = {
  appName: 'Adventurizer',
  books: 'Books',
  noBooks: 'No books yet. Create one to start an adventure.',
  newBook: 'New book',
  chooseLanguage: 'Pick the language of the book',
  genre: 'Genre',
  style: 'Style',
  artStyle: 'Art style of the images',
  author: 'Author style (optional)',
  authorHint:
    'Type any author or a mix, such as “Joe Abercrombie meets Terry Pratchett”. The suggestions are examples.',
  suggestAuthors: 'Suggest authors',
  suggestingAuthors: 'Looking for authors…',
  tone: 'Tone',
  realism: 'How realistic is the world?',
  audience: 'Who is the book for?',
  darkness: 'How dark can it get?',
  suggestTone: 'Suggest a tone',
  suggestingTone: 'Thinking about the tone…',
  length: 'Length',
  lengths: { short: 'Short', medium: 'Medium', long: 'Long' },
  pages: 'pages',
  next: 'Next',
  idea: 'What is the book about?',
  ideaHint:
    'Write a line or a few paragraphs. The agent writes a title and a blurb from it.',
  surpriseMe: 'Surprise me',
  writeBlurb: 'Write the blurb',
  writingBlurb: 'Writing the blurb…',
  title: 'Title',
  blurb: 'Blurb',
  comments: 'Comments for the next version',
  commentsHint:
    'You can also edit the title and the blurb above. The agent gets your edits and the comments.',
  newVersion: 'Write a new version',
  createBook: 'Create the book',
  writingFirstPage: 'Writing the plan, the world and the first page…',
  cancel: 'Back',
  page: 'Page',
  back: 'Back',
  startOver: 'Start over',
  allBooks: 'All books',
  writingPage: 'Writing the next page…',
  deadEnd: 'The story ends here.',
  goBack: 'Go back and choose again',
  imagePrompt: 'Image prompt',
  drawingImage: 'Drawing the picture…',
  newImage: 'Draw a new picture',
  cover: 'Cover',
  startReading: 'Start reading',
  continueReading: 'Continue',
  authorStyle: 'Author style',
  read: 'read',
  loading: 'Loading…',
  error: 'Something went wrong',
  tryAgain: 'Try again',
};

export type Strings = typeof en;

const fi: Strings = {
  appName: 'Adventurizer',
  books: 'Kirjat',
  noBooks: 'Ei vielä kirjoja. Luo kirja, niin seikkailu alkaa.',
  newBook: 'Uusi kirja',
  chooseLanguage: 'Valitse kirjan kieli',
  genre: 'Lajityyppi',
  style: 'Tyyli',
  artStyle: 'Kuvien tyyli',
  author: 'Kirjailijan tyyli (valinnainen)',
  authorHint:
    'Kirjoita kuka tahansa kirjailija tai sekoitus, kuten ”Joe Abercrombie meets Terry Pratchett”. Ehdotukset ovat esimerkkejä.',
  suggestAuthors: 'Ehdota kirjailijoita',
  suggestingAuthors: 'Etsitään kirjailijoita…',
  tone: 'Sävy',
  realism: 'Kuinka realistinen maailma on?',
  audience: 'Kenelle kirja on?',
  darkness: 'Kuinka synkäksi tarina voi mennä?',
  suggestTone: 'Ehdota sävyä',
  suggestingTone: 'Mietitään sävyä…',
  length: 'Pituus',
  lengths: { short: 'Lyhyt', medium: 'Keskipitkä', long: 'Pitkä' },
  pages: 'sivua',
  next: 'Seuraava',
  idea: 'Mistä kirja kertoo?',
  ideaHint:
    'Kirjoita rivi tai muutama kappale. Agentti kirjoittaa siitä nimen ja takakansitekstin.',
  surpriseMe: 'Yllätä minut',
  writeBlurb: 'Kirjoita takakansiteksti',
  writingBlurb: 'Kirjoitetaan takakansitekstiä…',
  title: 'Nimi',
  blurb: 'Takakansiteksti',
  comments: 'Kommentit seuraavaa versiota varten',
  commentsHint:
    'Voit myös muokata nimeä ja tekstiä yllä. Agentti saa muutoksesi ja kommenttisi.',
  newVersion: 'Kirjoita uusi versio',
  createBook: 'Luo kirja',
  writingFirstPage: 'Kirjoitetaan juonta, maailmaa ja ensimmäistä sivua…',
  cancel: 'Takaisin',
  page: 'Sivu',
  back: 'Takaisin',
  startOver: 'Aloita alusta',
  allBooks: 'Kaikki kirjat',
  writingPage: 'Kirjoitetaan seuraavaa sivua…',
  deadEnd: 'Tarina päättyy tähän.',
  goBack: 'Palaa ja valitse toisin',
  imagePrompt: 'Kuvakehote',
  drawingImage: 'Kuvaa piirretään…',
  newImage: 'Piirrä uusi kuva',
  cover: 'Kansi',
  startReading: 'Aloita lukeminen',
  continueReading: 'Jatka',
  authorStyle: 'Kirjailijan tyyli',
  read: 'luettu',
  loading: 'Ladataan…',
  error: 'Jokin meni vikaan',
  tryAgain: 'Yritä uudelleen',
};

export const strings: Record<Language, Strings> = { en, fi };

/**
 * The app texts outside a book are in English until the app has a language
 * setting. Inside a book, the texts are in the language of the book.
 */
export const appStrings = en;

export const languageNames: Record<Language, string> = {
  en: 'English',
  fi: 'Suomi',
};
