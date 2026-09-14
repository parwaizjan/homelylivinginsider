import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SITE = 'https://www.homelylivinginsider.com';
const SKIP_PAGES = new Set(['contact']);

const data = JSON.parse(
  fs.readFileSync(path.join(root, 'migration/wordpress-export.json'), 'utf8'),
);

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

turndown.keep(['figure', 'figcaption']);
turndown.addRule('wpComplexBlocks', {
  filter: (node) =>
    node.nodeName === 'DIV' &&
    typeof node.className === 'string' &&
    /wp-block-media-text|schema-faq|wp-block-columns|wp-block-group|wp-block-spacer/.test(
      node.className,
    ),
  replacement: (_content, node) => `\n\n${node.outerHTML}\n\n`,
});

function localize(html) {
  return html
    .replace(
      /(href|src)="https?:\/\/www\.homelylivinginsider\.com([^"]*)"/g,
      '$1="$2"',
    )
    .replace(/(srcset|sizes)="([^"]*)"/g, (_m, attr, value) => {
      return `${attr}="${value.split(SITE).join('')}"`;
    })
    .replace(
      /url\((['"]?)(https?:\/\/www\.homelylivinginsider\.com[^)'"]*)\1\)/g,
      (_m, quote, url) => `url(${quote}${url.replace(SITE, '')}${quote})`,
    );
}

function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMarkdown(html) {
  const md = turndown.turndown(localize(html || ''));
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

function quote(value) {
  return JSON.stringify(String(value));
}

function isoDate(value) {
  if (!value) return null;
  const d = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function pathname(url) {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${quote(item)}`);
    } else {
      lines.push(`${key}: ${quote(value)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function writeCollection(kind, items, mapper) {
  const dir = path.join(root, 'src/content', kind);
  fs.mkdirSync(dir, { recursive: true });
  for (const item of items) {
    const { frontmatter, body } = mapper(item);
    const file = path.join(dir, `${item.slug}.md`);
    fs.writeFileSync(file, `${buildFrontmatter(frontmatter)}${body}\n`, 'utf8');
  }
}

const categoryById = new Map(data.categories.map((c) => [String(c.id), c.name]));

function postFields(post) {
  const date = isoDate(post.date);
  const updated = isoDate(post.modified);
  const categories = post.categories.map((c) => c.name);
  const primaryId = post.yoast?.primary_cat;
  const primary = categoryById.get(String(primaryId)) || categories[0];
  return {
    title: post.title,
    description: post.yoast?.metadesc || stripTags(post.excerpt).slice(0, 160) || undefined,
    date,
    updated: updated && updated !== date ? updated : undefined,
    category: primary || undefined,
    categories,
    featuredImage: pathname(post.featured_image) || undefined,
    featuredImageAlt: post.featured_alt || undefined,
    seoTitle: post.yoast?.title || undefined,
    canonical: post.yoast?.canonical || undefined,
  };
}

writeCollection('posts', data.posts, (post) => ({
  frontmatter: postFields(post),
  body: toMarkdown(post.content),
}));

writeCollection(
  'pages',
  data.pages.filter((p) => !SKIP_PAGES.has(p.slug)),
  (page) => ({
    frontmatter: {
      title: page.title,
      description: page.yoast?.metadesc || undefined,
      updated: isoDate(page.modified) || undefined,
      seoTitle: page.yoast?.title || undefined,
      canonical: page.yoast?.canonical || undefined,
    },
    body: toMarkdown(page.content),
  }),
);

console.log(
  `Converted ${data.posts.length} posts and ${
    data.pages.length - SKIP_PAGES.size
  } pages.`,
);
