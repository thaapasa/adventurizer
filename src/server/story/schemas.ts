import { z } from 'zod';

const entitySchema = z.object({
  name: z.string(),
  description: z.string(),
  looks: z.string(),
});

export const pageOutputSchema = z.object({
  text: z.string(),
  actions: z.array(z.string()),
  imagePrompt: z.string(),
  worldChanges: z.array(z.string()),
  milestones: z.array(z.number().int()),
});
export type PageOutput = z.infer<typeof pageOutputSchema>;

export const planSchema = z.object({
  truth: z.string(),
  milestones: z.array(z.string()),
  endings: z.array(z.string()),
  toneRules: z.array(z.string()),
});

export const openingOutputSchema = z.object({
  // The plan comes first, so that the agent decides where the story goes
  // before it makes the world and the first page.
  plan: planSchema,
  world: z.object({
    people: z.array(entitySchema),
    places: z.array(entitySchema),
    details: z.array(z.string()),
  }),
  coverPrompt: z.string(),
  page: pageOutputSchema,
});
export type OpeningOutput = z.infer<typeof openingOutputSchema>;

export const pitchOutputSchema = z.object({
  title: z.string(),
  blurb: z.string(),
});

export const authorsOutputSchema = z.object({
  authors: z.array(z.object({ name: z.string(), note: z.string() })),
});

export const toneOutputSchema = z.object({
  realism: z.array(z.string()),
  audience: z.array(z.string()),
  darkness: z.array(z.string()),
});
