import { useMemo, useRef } from 'react';
import {
  articleAddress,
  dedupeEvents,
  slugFromArticleAddress,
} from '~/lib/nostr/events';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';
import { useNostrSubscription } from '~/lib/nostr/useNostrSubscription';
import { ATS_PUBKEY } from '~/config/feeds';
import type { NostrEvent } from '@nostrify/types';

function commentFiltersForSlugs(slugs: readonly string[]) {
  const addresses = slugs.map((slug) => articleAddress(ATS_PUBKEY, slug));
  return [
    { kinds: [1111], '#A': addresses, limit: 500 },
    { kinds: [1111], '#a': addresses, limit: 500 },
  ];
}

function countCommentsBySlug(events: NostrEvent[], slugs: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slug of slugs) counts.set(slug, 0);

  for (const event of dedupeEvents(events)) {
    const rootTag = event.tags.find((t) => (t[0] === 'A' || t[0] === 'a') && t[1]);
    const slug = rootTag?.[1] ? slugFromArticleAddress(rootTag[1]) : null;
    if (!slug || !counts.has(slug)) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  return counts;
}

export function useArticleCommentCounts(slugs: readonly string[]) {
  const stableSlugs = useMemo(() => [...slugs], [slugs.join('|')]);
  const query = useNostrQuery(
    ['nostr', 'article-comments', 'counts', ...stableSlugs],
    commentFiltersForSlugs(stableSlugs),
    { enabled: stableSlugs.length > 0 },
  );

  const counts = useMemo(
    () => countCommentsBySlug(query.data ?? [], stableSlugs),
    [query.data, stableSlugs],
  );

  return { counts, isLoading: query.isLoading };
}

export function useArticleCommentCount(slug: string) {
  const { counts, isLoading } = useArticleCommentCounts([slug]);
  return { count: counts.get(slug) ?? 0, isLoading };
}

export function useArticleComments(slug: string, nostrEventId?: string) {
  const addr = articleAddress(ATS_PUBKEY, slug);
  const mountedAt = useRef(Math.floor(Date.now() / 1000));

  const commentsQueryKey = ['nostr', 'article', slug, 'comments'];

  const commentsQ = useNostrQuery(
    commentsQueryKey,
    [
      { kinds: [1111], '#A': [addr], limit: 500 },
      { kinds: [1111], '#a': [addr], limit: 500 },
    ],
  );

  useNostrSubscription(
    commentsQueryKey,
    [{ kinds: [1111], '#A': [addr], since: mountedAt.current }],
  );

  const articleQ = useNostrQuery(
    ['nostr', 'article', slug, 'event'],
    [{ kinds: [30023], authors: [ATS_PUBKEY], '#d': [slug], limit: 1 }],
    { enabled: !nostrEventId },
  );

  const comments = useMemo(() => dedupeEvents(commentsQ.data ?? []), [commentsQ.data]);
  const articleEvent = useMemo(() => {
    if (nostrEventId) {
      const fromRelay = articleQ.data?.[0];
      if (fromRelay) return fromRelay;
      return {
        id: nostrEventId,
        pubkey: ATS_PUBKEY,
        kind: 30023,
        tags: [['d', slug]],
        content: '',
        created_at: 0,
        sig: '',
      } satisfies NostrEvent;
    }
    return articleQ.data?.[0];
  }, [articleQ.data, nostrEventId, slug]);

  return {
    comments,
    articleEvent,
    isLoading: commentsQ.isLoading || (!nostrEventId && articleQ.isLoading),
  };
}
