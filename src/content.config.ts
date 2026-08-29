import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const quotes = defineCollection({
  loader: file('./src/entities/quote/quotes.json'),
  schema: z.object({
    text: z.string(),
    author: z.string(),
    source: z.string().optional(),
  }),
});

export const collections = { blog, quotes };
