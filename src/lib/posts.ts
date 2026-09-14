import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from './site';

export type Post = CollectionEntry<'posts'>;
export type Page = CollectionEntry<'pages'>;

export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export function excerptFromBody(body: string | undefined, words = 55): string {
  const text = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/[*_`~>]/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = text.split(' ');
  if (parts.length <= words) return text;
  return `${parts.slice(0, words).join(' ')}…`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
}

export function categorySlug(name: string): string {
  const known = SITE.categories.find((c) => c.name === name);
  if (known) return known.slug;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
