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
});
export type PageOutput = z.infer<typeof pageOutputSchema>;

export const openingOutputSchema = z.object({
  title: z.string(),
  world: z.object({
    people: z.array(entitySchema),
    places: z.array(entitySchema),
    details: z.array(z.string()),
  }),
  page: pageOutputSchema,
});
export type OpeningOutput = z.infer<typeof openingOutputSchema>;

export const authorsOutputSchema = z.object({
  authors: z.array(z.object({ name: z.string(), note: z.string() })),
});
