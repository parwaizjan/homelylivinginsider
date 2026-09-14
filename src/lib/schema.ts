import { SITE } from './site';

const abs = (path: string) => new URL(path, SITE.url).href;

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: SITE.title,
        description: SITE.tagline,
        inLanguage: SITE.language,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE.url}/#webpage`,
        url: `${SITE.url}/`,
        name: SITE.title,
        description: SITE.tagline,
        isPartOf: { '@id': `${SITE.url}/#website` },
        inLanguage: SITE.language,
      },
    ],
  };
}

interface ArticleInput {
  url: string;
  title: string;
  description?: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  category?: string;
}

export function articleSchema({
  url,
  title,
  description,
  image,
  datePublished,
  dateModified,
  category,
}: ArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: title,
    description,
    image: image ? [abs(image)] : undefined,
    datePublished,
    dateModified,
    articleSection: category,
    author: { '@type': 'Person', name: SITE.author },
    publisher: {
      '@type': 'Organization',
      name: SITE.title,
      logo: { '@type': 'ImageObject', url: abs(SITE.logo) },
    },
    inLanguage: SITE.language,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function collectionPageSchema(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    isPartOf: { '@id': `${SITE.url}/#website` },
    inLanguage: SITE.language,
  };
}
