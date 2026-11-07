import type { Language } from './types.js';

export interface SettingSuggestions {
  genres: string[];
  styles: string[];
  artStyles: string[];
}

export const settingSuggestions: Record<Language, SettingSuggestions> = {
  en: {
    genres: [
      'Fantasy',
      'Science fiction',
      'Horror',
      'Mystery',
      'Post-apocalyptic',
      'Pirate adventure',
      'Steampunk',
    ],
    styles: [
      'Easy-going',
      'Grimdark',
      'Young adult',
      'Humorous',
      'Epic',
      'Noir',
      'Cozy',
    ],
    artStyles: [
      'Watercolor illustration',
      'Ink drawing',
      'Oil painting',
      '1980s gamebook line art',
      'Comic book',
      'Cinematic digital painting',
    ],
  },
  fi: {
    genres: [
      'Fantasia',
      'Tieteisfiktio',
      'Kauhu',
      'Mysteeri',
      'Maailmanlopun jälkeen',
      'Merirosvoseikkailu',
      'Höyrypunk',
    ],
    styles: [
      'Leppoisa',
      'Synkkä',
      'Nuorten',
      'Humoristinen',
      'Eeppinen',
      'Noir',
      'Kodikas',
    ],
    artStyles: [
      'Vesiväri-kuvitus',
      'Tussipiirros',
      'Öljymaalaus',
      '1980-luvun pelikirjan viivapiirros',
      'Sarjakuva',
      'Elokuvamainen digimaalaus',
    ],
  },
};
