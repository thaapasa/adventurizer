import type {
  Book,
  BookSettings,
  Language,
  Page,
  World,
} from '../../shared/types.js';

const languageNames: Record<Language, string> = {
  en: 'English',
  fi: 'Finnish',
};

function settingsSection(settings: BookSettings): string {
  const language = languageNames[settings.language];
  const lines = [
    '# The book',
    '',
    `- Language: ${language}. Write the title, the page text, the actions and the world data in ${language}. Write the image prompts in English, because image generators work best with English.`,
    `- Genre: ${settings.genre}`,
    `- Style: ${settings.style}`,
    `- Art style of the images: ${settings.artStyle}`,
  ];
  if (settings.author) {
    lines.push(
      `- Author style: ${settings.author}. Write in this style. If it names several authors, such as "A meets B", blend their styles. Imitate the voice, rhythm, humor and tone, but do not copy their text, characters or places.`,
    );
  }
  return lines.join('\n');
}

const writingRules = `You write an adventure book that the reader plays, like the gamebooks of the 1980s. You write one page at a time. The reader reads the page, picks one of its actions, and you write the page that follows from that action.

# How to write a page

- Write in the second person: the reader is "you". Write in the present tense.
- A page is 150 to 400 words. Show what happens because of the action the reader picked, and end at a point where the reader has to decide what to do next.
- Give 2 to 4 actions. Each action is a short sentence that starts with a verb, such as "Follow the smuggler into the alley". The actions lead to clearly different directions.
- Choices have consequences. Danger is real, and a bad choice can hurt the reader or end the story.
- A page can be a dead end with no actions, when the story ends there: the reader dies, wins, or the adventure ends in some other way. Dead ends are rare, at most one page in ten, and never on the first page. On a dead end, write a proper ending.
- Keep to the world data and to everything that has happened on the earlier pages. People, places and their looks stay as they are described.

# World changes

On each page, list what changed in the world on that page, such as "Mara is now the reader's ally", "The mill burned down" or "The reader has the silver key". Write each change as one short sentence. Leave the list empty if nothing changed. Introduce a new person or place by giving the name and the looks in a change, such as "New person: Tolvo, the ferryman. Looks: a stooped old man in a tar-black coat, with a white beard".

# Image prompt

Write an image prompt for the scene of the page, for an image generator such as Stable Diffusion. Write it in English, as a comma-separated list of the subject, the setting, the light and the mood. Start with the art style of the book. If a person or place from the world data is in the picture, copy its looks word for word, so that it looks the same on every page. Do not put text, letters or the reader's face in the picture.`;

/** The system prompt for the first call, which makes the world and page 1. */
export function openingSystemPrompt(settings: BookSettings): string {
  return `${writingRules}

# The world data

Before the first page, make up the world of the book: a title, 3 to 6 people, 3 to 6 places, and a few other details, such as the time, the customs or a secret. Give each person and place a short description of who or what they are, and the looks: a visual description of one or two sentences that an image generator can use.

# The cover

Write an image prompt for the cover of the book, in the same way as the image prompts of the pages. Show the main place or the main person of the book in a scene that sets the mood of the story. Do not put the title or any other text on the cover.

${settingsSection(settings)}`;
}

export function openingBlocks(): string[] {
  return [
    'Make up the world of the book and write the first page. The first page sets the scene and gives the reader the first choice.',
  ];
}

export function formatWorld(world: World): string {
  const entity = (e: { name: string; description: string; looks: string }) =>
    `- ${e.name}: ${e.description} Looks: ${e.looks}`;
  return [
    '## People',
    ...world.people.map(entity),
    '',
    '## Places',
    ...world.places.map(entity),
    '',
    '## Details',
    ...world.details.map((d) => `- ${d}`),
  ].join('\n');
}

/**
 * The system prompt for every later page of the book. It holds only what
 * stays the same for the whole book, so it can be cached.
 */
export function bookSystemPrompt(book: Book): string {
  return `${writingRules}

${settingsSection(book.settings)}

# The world data at the start of the book

The title of the book is "${book.title}". This is the world as it is on the first page. The pages tell what has changed since.

${formatWorld(book.world)}`;
}

function pageBlock(page: Page, number: number): string {
  const lines = [`# Page ${number}`, '', page.text, ''];
  if (page.worldChanges.length > 0) {
    lines.push(
      'World changes on this page:',
      ...page.worldChanges.map((c) => `- ${c}`),
      '',
    );
  }
  lines.push('Actions:', ...page.actions.map((a, i) => `${i + 1}. ${a}`));
  return lines.join('\n');
}

function choiceBlock(page: Page, choiceIndex: number, next: number): string {
  return `The reader picks action ${choiceIndex + 1}: ${page.actions[choiceIndex]}

Write page ${next}.`;
}

/**
 * The user message for writing the page that follows `path`, when the reader
 * picks `choiceIndex` on the last page. The blocks of a page and the choice
 * made on it are the same on every later request of the path, so the earlier
 * part of the path stays in the prompt cache.
 */
export function pathBlocks(path: Page[], choiceIndex: number): string[] {
  const blocks: string[] = [];
  path.forEach((page, i) => {
    blocks.push(pageBlock(page, i + 1));
    const next = path[i + 1];
    const choice = next ? next.choiceIndex : choiceIndex;
    if (choice === null) throw new Error(`Page ${next?.id} has no choice`);
    blocks.push(choiceBlock(page, choice, i + 2));
  });
  return blocks;
}

export function authorsSystemPrompt(): string {
  return 'You suggest authors whose writing style fits an adventure book. Suggest 6 well-known authors who write in the given language, or whose books are widely read in it, and whose style fits the genre and the style. For each author, write the name and a note of at most 12 words on why their style fits. Write the notes in the given language.';
}

export function authorsBlocks(
  language: Language,
  genre: string,
  style: string,
): string[] {
  return [
    `Language: ${languageNames[language]}\nGenre: ${genre}\nStyle: ${style}`,
  ];
}
