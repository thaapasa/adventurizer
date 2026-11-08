import {
  type Book,
  type BookPitch,
  type BookSettings,
  type Language,
  lengthPages,
  type Page,
  type StoryPlan,
  type World,
} from '../../shared/types.js';

const languageNames: Record<Language, string> = {
  en: 'English',
  fi: 'Finnish',
};

function toneLines(settings: BookSettings): string[] {
  const lines: string[] = [];
  if (settings.realism) lines.push(`- Realism: ${settings.realism}`);
  if (settings.audience) lines.push(`- Target reader: ${settings.audience}`);
  if (settings.darkness) lines.push(`- Darkness: ${settings.darkness}`);
  return lines;
}

const toneRule =
  'Keep to the tone settings. Do not make the story stranger, sillier or darker than the settings and the blurb ask for. If the world is grounded, the humor comes from the people and the situations, not from nonsense.';

function settingsSection(settings: BookSettings): string {
  const language = languageNames[settings.language];
  const lines = [
    '# The book',
    '',
    `- Language: ${language}. Write the page text, the actions and the world data in ${language}. Write the image prompts in English, because image generators work best with English.`,
    `- Genre: ${settings.genre}`,
    `- Style: ${settings.style}`,
    ...toneLines(settings),
    `- Art style of the images: ${settings.artStyle}`,
  ];
  if (settings.author) {
    lines.push(
      `- Author style: ${settings.author}. Write in this style. If it names several authors, such as "A meets B", blend their styles. Imitate the voice, rhythm, humor and tone, but do not copy their text, characters or places.`,
    );
  }
  lines.push('', toneRule);
  return lines.join('\n');
}

function lengthSection(settings: BookSettings): string {
  const [min, max] = lengthPages[settings.length];
  return `# Length and pacing

A path through the book reaches an ending in about ${min} to ${max} pages. Pace the story by the page number and by the milestones that the path has reached:

- Before page ${min}, end a path only when the reader makes a fatal mistake.
- From page ${min} on, steer the path towards one of the endings of the plan.
- By page ${max}, the path ends.`;
}

const writingRules = `You write an adventure book that the reader plays, like the gamebooks of the 1980s. You write one page at a time. The reader reads the page, picks one of its actions, and you write the page that follows from that action.

# How to write a page

- Write in the second person: the reader is "you". Write in the present tense.
- A page is 150 to 400 words. Show what happens because of the action the reader picked, and end at a point where the reader has to decide what to do next.
- Each page moves the story forward: something changes, the reader learns something, or a decision has a result. Do not write a page that only repeats the picked action in a slightly different form, and do not offer actions that are only small variations of the action just picked.
- Give 3 to 5 actions. Each action is a short sentence that starts with a verb, such as "Follow the smuggler into the alley". The actions lead to clearly different directions, so that each choice matters.
- Vary the kinds of actions, such as talking, fighting, sneaking, investigating or leaving. Do not make them all safe or all reckless.
- Choices have consequences. Danger is real, and a bad choice can hurt the reader or end the story.
- A page can be a dead end with no actions, when the story ends there: the reader dies, wins, or the adventure ends in some other way. Never end the story on the first page. On a dead end, write a proper ending.
- Keep to the world data and to everything that has happened on the earlier pages. People, places and their looks stay as they are described.

# The plan

The book has a plan that the reader does not see. Use it to keep the story focused on what the blurb promises:

- The truth tells what is really going on. Reveal it bit by bit, through clues that agree with each other on every path.
- The milestones are steps that a path can reach in any order. Steer the story towards them, but let the reader's choices decide the way.
- The endings are the kinds of endings that a path can reach. End a path in one of them, or in an ending of the same spirit.
- Follow the tone rules.

On each page, list the numbers of the milestones that the path reached on that page. Leave the list empty if it reached none.

# World changes

On each page, list what changed in the world on that page, such as "Mara is now the reader's ally", "The mill burned down" or "The reader has the silver key". Write each change as one short sentence. Leave the list empty if nothing changed. Introduce a new person or place by giving the name and the looks in a change, such as "New person: Tolvo, the ferryman. Looks: a stooped old man in a tar-black coat, with a white beard".

# Image prompt

Write an image prompt for the scene of the page, for an image generator such as Stable Diffusion. Write it in English, as a comma-separated list of the subject, the setting, the light and the mood. Start with the art style of the book. If a person or place from the world data is in the picture, copy its looks word for word, so that it looks the same on every page. Do not put text, letters or the reader's face in the picture.`;

function pitchSection(pitch: BookPitch): string {
  return `# The title and the blurb

The title of the book is "${pitch.title}". The blurb on the back cover tells the reader what the book is about:

${pitch.blurb}`;
}

/** The system prompt for the first call, which makes the plan, the world and page 1. */
export function openingSystemPrompt(
  settings: BookSettings,
  pitch: BookPitch,
): string {
  return `${writingRules}

# Making the book

Before the first page, make the plan and the world of the book from the blurb. Keep to what the blurb promises: its people, places and premise.

The plan has:

- the truth: the secrets behind the blurb, what the antagonist wants and what is really going on, in a short paragraph
- 3 to 5 milestones that a path can reach in any order, such as "The reader finds out who stole the crown"
- 3 to 5 kinds of endings: at least one good one, a couple of failures and possibly a strange one
- 2 to 4 tone rules that follow from the settings, such as "The world is grounded, and the humor comes from the people"

The world has 3 to 6 people, 3 to 6 places, and a few other details, such as the time or the customs. Give each person and place a short description of who or what they are, and the looks: a visual description of one or two sentences that an image generator can use. Write the plan and the world in the language of the book.

# The cover

Write an image prompt for the cover of the book, in the same way as the image prompts of the pages. Show the main place or the main person of the book in a scene that sets the mood of the story. Do not put the title or any other text on the cover.

${settingsSection(settings)}

${lengthSection(settings)}

${pitchSection(pitch)}`;
}

export function openingBlocks(): string[] {
  return [
    'Make the plan and the world of the book, and write the first page. The first page sets the scene and gives the reader the first choice.',
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

export function formatPlan(plan: StoryPlan): string {
  return [
    '## The truth',
    plan.truth,
    '',
    '## Milestones',
    ...plan.milestones.map((m, i) => `${i + 1}. ${m}`),
    '',
    '## Endings',
    ...plan.endings.map((e) => `- ${e}`),
    '',
    '## Tone rules',
    ...plan.toneRules.map((r) => `- ${r}`),
  ].join('\n');
}

/**
 * The system prompt for every later page of the book. It holds only what
 * stays the same for the whole book, so it can be cached.
 */
export function bookSystemPrompt(book: Book): string {
  return `${writingRules}

${settingsSection(book.settings)}

${lengthSection(book.settings)}

${pitchSection(book)}

# The plan

${formatPlan(book.plan)}

# The world data at the start of the book

This is the world as it is on the first page. The pages tell what has changed since.

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

function choiceBlock(
  page: Page,
  choiceIndex: number,
  next: number,
  reached: number[],
): string {
  const milestones = reached.length > 0 ? reached.join(', ') : 'none yet';
  return `The reader picks action ${choiceIndex + 1}: ${page.actions[choiceIndex]}

Milestones reached on this path: ${milestones}.

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
  const reached = new Set<number>();
  path.forEach((page, i) => {
    blocks.push(pageBlock(page, i + 1));
    page.milestones.forEach((m) => reached.add(m));
    const next = path[i + 1];
    const choice = next ? next.choiceIndex : choiceIndex;
    if (choice === null) throw new Error(`Page ${next?.id} has no choice`);
    blocks.push(
      choiceBlock(
        page,
        choice,
        i + 2,
        [...reached].sort((a, b) => a - b),
      ),
    );
  });
  return blocks;
}

export function pitchSystemPrompt(settings: BookSettings): string {
  const language = languageNames[settings.language];
  return `You write the title and the blurb for an adventure book that the reader plays, like the gamebooks of the 1980s. The blurb is the text on the back cover that tells a reader in a bookshop what the book is about and makes them want to read it.

- Write the title and the blurb in ${language}.
- The blurb is 80 to 150 words. It sets up the premise, the hero and what is at stake, and hints at the danger and the choices, without telling how the story ends. The reader plays the hero, so the blurb can speak to the reader as "you".
- Build on the idea of the user. If there is no idea, come up with one that fits the settings.
- If the user gives a current version and comments, write a new version that follows the comments. Keep what the comments do not ask to change, including the user's own edits.

# The settings

- Genre: ${settings.genre}
- Style: ${settings.style}
${[...toneLines(settings), settings.author ? `- Author style: ${settings.author}` : ''].filter(Boolean).join('\n')}

${toneRule}`;
}

export function pitchBlocks(
  idea: string | null,
  current?: BookPitch,
  comments?: string,
): string[] {
  const blocks = [
    idea
      ? `The idea of the book:\n\n${idea}`
      : 'There is no idea. Come up with one that fits the settings.',
  ];
  if (current) {
    blocks.push(
      `The current version:\n\nTitle: ${current.title}\n\n${current.blurb}`,
    );
  }
  if (comments) blocks.push(`The comments of the user:\n\n${comments}`);
  blocks.push(
    current ? 'Write a new version.' : 'Write the title and the blurb.',
  );
  return blocks;
}

export function authorsSystemPrompt(): string {
  return 'You suggest authors whose writing style fits an adventure book. Suggest 6 well-known authors who write in the given language, or whose books are widely read in it, and whose style fits the genre and the style. For each author, write the name and a note of at most 12 words on why their style fits. Write the notes in the given language.';
}

export function toneSystemPrompt(): string {
  return `You suggest the tone of an adventure book from its genre and style. Suggest 4 options for each of these, from one end of the scale to the other, each at most 5 words:

- realism: how realistic the world is, such as "grounded", "a little odd" or "absurd"
- audience: the target reader, such as "children", "young adults" or "adults"
- darkness: how dark the story can get, such as "light", "some danger" or "grim"

Fit the options to the genre and the style, so that the most likely choice is among them. Write them in the given language.`;
}

export function genreBlocks(
  language: Language,
  genre: string,
  style: string,
): string[] {
  return [
    `Language: ${languageNames[language]}\nGenre: ${genre}\nStyle: ${style}`,
  ];
}
