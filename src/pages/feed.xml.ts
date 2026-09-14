import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts } from '../lib/posts';
import { SITE } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getSortedPosts();

  return rss({
    title: SITE.title,
    description: SITE.tagline,
    site: context.site ?? SITE.url,
    trailingSlash: true,
    customData: `<language>en-US</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${post.id}/`,
      categories: post.data.categories,
    })),
  });
}
