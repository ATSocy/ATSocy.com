import { useMemo, useRef } from 'react';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';
import { useNostrSubscription } from '~/lib/nostr/useNostrSubscription';
import {
  buildReplyTree,
  myVotesByTarget,
  scoreReactions,
  type PostNode,
} from '~/lib/nostr/events';
import { USE_MOCK_EVENTS } from '~/config/feeds';
import { ATSOCY_TOPICS } from '~/lib/nostr/atsocy-tags';
import type { NostrEvent } from '@nostrify/types';

export interface PulseFeedOptions {
  since?: number;
  /** Active user's pubkey — when provided, `myVoteByTarget` tracks their votes. */
  pubkey?: string | null;
}

/**
 * usePulseFeed — the Pulse data layer. Subscribes to kind 1 posts, kind 7
 * reactions, kind 0 metadata, and kind 1018 poll responses via the shared
 * Nostrify store, then builds the reply tree, the current user's vote map,
 * and the per-parent poll-response lookup.
 *
 * `pubkey` is optional so feed components can render without a login context
 * (e.g. PulseHot's skeleton during SSR). When omitted, `myVoteByTarget` is
 * always empty.
 *
 * Returns the raw queries (for `isLoading`/`data`) plus derived `tree`,
 * `myVoteByTarget`, and `pollResponsesByParent` so consumers don't reimplement
 * NIP-10 / NIP-25 / NIP-88 grouping logic.
 */
export function usePulseFeed(options: PulseFeedOptions = {}) {
  const since = options.since;
  const pubkey = options.pubkey ?? null;

  // Stable mount timestamp so the subscription filter never changes
  const mountedAt = useRef(Math.floor(Date.now() / 1000));

  // Single source of truth for the per-feed cache key suffix, derived from the
  // same inputs the filters use so the key and the filter cannot drift apart.
  const scopeKey = useMemo(
    () => `${USE_MOCK_EVENTS ? 'mock' : 'live'}:${since ?? 'all'}`,
    [since],
  );
  const key = (scope: string) => ['nostr', 'pulse', scope, scopeKey] as string[];

  const postFilter = useMemo(
    () => [{ kinds: [1, 1068], '#t': [ATSOCY_TOPICS.pulse], ...(since ? { since } : {}) }],
    [since],
  );
  const reactionFilter = useMemo(() => [{ kinds: [7] }], []);
  const metaFilter = useMemo(() => [{ kinds: [0] }], []);
  const pollResponseFilter = useMemo(() => [{ kinds: [1018] }], []);

  const postsQueryKey = key('posts');
  const reactionsQueryKey = key('reactions');
  const metaQueryKey = key('meta');
  const pollResponsesQueryKey = key('poll-responses');

  const postsQ = useNostrQuery(postsQueryKey, postFilter);
  const reactionsQ = useNostrQuery(reactionsQueryKey, reactionFilter);
  const metaQ = useNostrQuery(metaQueryKey, metaFilter);
  const pollResponsesQ = useNostrQuery(pollResponsesQueryKey, pollResponseFilter);

  // Live subscriptions: stream new events from other clients into the cache.
  // `since: mountedAt` limits the stream to events that arrive after mount.
  const live = !USE_MOCK_EVENTS;
  useNostrSubscription(postsQueryKey, [{ kinds: [1, 1068], '#t': [ATSOCY_TOPICS.pulse], since: mountedAt.current }], { enabled: live });
  useNostrSubscription(reactionsQueryKey, [{ kinds: [7], since: mountedAt.current }], { enabled: live });
  useNostrSubscription(pollResponsesQueryKey, [{ kinds: [1018], since: mountedAt.current }], { enabled: live });

  const tree = useMemo<PostNode[]>(() => {
    const posts = postsQ.data ?? [];
    const postIds = new Set(posts.map((p) => p.id));
    const reactions = (reactionsQ.data ?? []).filter((r) => {
      for (const t of r.tags) {
        if (t[0] === 'e' && postIds.has(t[1])) return true;
      }
      return false;
    });
    return buildReplyTree(posts, scoreReactions(reactions));
  }, [postsQ.data, reactionsQ.data]);

  const myVoteByTarget = useMemo(
    () => (pubkey ? myVotesByTarget(reactionsQ.data ?? [], pubkey) : new Map<string, 'up' | 'down'>()),
    [reactionsQ.data, pubkey],
  );

  // Group kind-1018 poll responses by their parent event id (`e` tag) so each
  // row can look up its responses without re-scanning the whole stream.
  const pollResponsesByParent = useMemo(() => {
    const map = new Map<string, NostrEvent[]>();
    for (const r of pollResponsesQ.data ?? []) {
      const parentId = r.tags.find((t) => t[0] === 'e')?.[1];
      if (!parentId) continue;
      const list = map.get(parentId);
      if (list) list.push(r);
      else map.set(parentId, [r]);
    }
    return map;
  }, [pollResponsesQ.data]);

  return { postsQ, reactionsQ, metaQ, pollResponsesQ, tree, myVoteByTarget, pollResponsesByParent };
}
