import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string().optional(),
    categories: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),
    seoTitle: z.string().optional(),
    canonical: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updated: z.coerce.date().optional(),
    seoTitle: z.string().optional(),
    canonical: z.string().optional(),
  }),
});

export const collections = { posts, pages };
