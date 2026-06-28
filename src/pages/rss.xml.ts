import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { articleHref } from '~/lib/articles/posts';
import { SITE } from '~/site.config';

export async function GET(context: APIContext) {
  const [news, kya] = await Promise.all([
    getCollection('news', (post) => !post.data.draft),
    getCollection('kya', (post) => !post.data.draft),
  ]);
  const posts = [...news, ...kya].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const items = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    link: articleHref(post),
  }));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    trailingSlash: false,
  });
}
