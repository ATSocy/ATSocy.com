import type { CollectionEntry } from 'astro:content';

export type ArticleEntry =
  | CollectionEntry<'news'>
  | CollectionEntry<'kya'>
  | CollectionEntry<'guides'>;

export function articleHref(post: ArticleEntry): string {
  switch (post.collection) {
    case 'guides':
      return `/guides/${post.id}`;
    case 'kya':
      return `/kya/${post.id}`;
    default:
      return `/${post.id}`;
  }
}

/** Nostr `d` tag / NIP-22 `#A` address slug. */
export function nostrDocumentId(post: ArticleEntry): string {
  switch (post.collection) {
    case 'guides':
      return `guides/${post.id}`;
    case 'kya':
      return `kya/${post.id}`;
    default:
      return post.id;
  }
}

export function allowsComments(post: ArticleEntry): boolean {
  return post.data.comments;
}

export function publishesToNostr(post: ArticleEntry): boolean {
  return post.data.nostr;
}
