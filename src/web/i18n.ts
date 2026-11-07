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
  createBook: 'Create the book',
  writingFirstPage: 'Writing the world and the first page…',
  cancel: 'Back',
  page: 'Page',
  back: 'Back',
  startOver: 'Start over',
  allBooks: 'All books',
  writingPage: 'Writing the next page…',
  deadEnd: 'The story ends here.',
  goBack: 'Go back and choose again',
  imagePrompt: 'Image prompt',
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
  createBook: 'Luo kirja',
  writingFirstPage: 'Kirjoitetaan maailmaa ja ensimmäistä sivua…',
  cancel: 'Takaisin',
  page: 'Sivu',
  back: 'Takaisin',
  startOver: 'Aloita alusta',
  allBooks: 'Kaikki kirjat',
  writingPage: 'Kirjoitetaan seuraavaa sivua…',
  deadEnd: 'Tarina päättyy tähän.',
  goBack: 'Palaa ja valitse toisin',
  imagePrompt: 'Kuvakehote',
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
