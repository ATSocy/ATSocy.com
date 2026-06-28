import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { usePulseFeed } from './usePulseFeed';
import { useFlipReorder } from './useFlipReorder';
import { PulseFeedSkeleton, PulseRow } from './PulseRow';
import { PulseHotSlot, type PulseHotEntry } from './PulseHotSlot';
import { byHot, type PostNode } from '~/lib/nostr/events';
import { FEED_LIMITS } from '~/config/feeds';
import type { NostrEvent } from '@nostrify/types';

/**
 * Pulse — the reddit/HN-style participatory feed and the site's main content.
 * Open to all — reads kind 1 posts threaded by NIP-10 positional `e` tags,
 * with upvotes from NIP-25 reactions (kind 7, content "+"). Sort hot/new/top;
 * infinite scroll.
 *
 * STATIC-FIRST CONTRACT (docs/SITE-ARCHITECTURE.md): reads via the shared
 * Nostrify store; `data-nosnippet`; excluded from sitemap/JSON-LD; hot/top
 * ranking computed client-side (Nostr has no server-side score sort).
 */

const EMPTY_META: NostrEvent[] = [];

export interface PulseProps {
  initial?: number;
  increment?: number;
  windowHours?: number;
}

export function Pulse(props: PulseProps) {
  return (
    <NostrIsland>
      <PulseInner {...props} />
    </NostrIsland>
  );
}

function PulseInner({
  initial = FEED_LIMITS.pulseInitial,
  increment = FEED_LIMITS.pulseIncrement,
  windowHours,
}: PulseProps) {
  // `visible` resets when the `initial` prop changes (prev-prop pattern, no effect).
  // oxlint-disable-next-line react-doctor/no-derived-useState — initialized from a prop on purpose; the prev-prop block below re-syncs on prop change.
  const [visible, setVisible] = useState(initial);
  const prevInitialRef = useRef(initial);
  if (initial !== prevInitialRef.current) {
    prevInitialRef.current = initial;
    setVisible(initial);
  }

  const sentinelObserverRef = useRef<IntersectionObserver | null>(null);
  const since = useMemo(
    () => (windowHours ? Math.floor(Date.now() / 1000) - windowHours * 60 * 60 : undefined),
    [windowHours],
  );

  const user = useCurrentUser();
  const { postsQ, reactionsQ, metaQ, tree, myVoteByTarget, pollResponsesByParent } = usePulseFeed({ since, pubkey: user?.pubkey ?? null });

  const sorted = useMemo<PostNode[]>(() => tree.toSorted(byHot), [tree]);
  const sortedVisible = useMemo(() => sorted.slice(0, visible), [sorted, visible]);
  const sortedVisibleIds = useMemo(() => sortedVisible.map((p) => p.event.id), [sortedVisible]);

  // Keep a stable array reference for useFlipReorder's deps — only changes
  // when the actual ID sequence changes, not when upstream references change
  // (e.g., postsQ re-fetch returning the same events in a different order).
  // Without this, the FLIP effect fires on every re-fetch, animating from a
  // stale dy caused by unrelated layout shifts (image load, font render).
  const stableIdsRef = useRef<string[]>(sortedVisibleIds);
  if (stableIdsRef.current.join('|') !== sortedVisibleIds.join('|')) {
    stableIdsRef.current = sortedVisibleIds;
  }

  const { bindRowRef, markHero } = useFlipReorder(stableIdsRef.current);

  const bindSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      sentinelObserverRef.current?.disconnect();
      sentinelObserverRef.current = null;
      if (!node) return;

      const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + increment, tree.length));
      });

      observer.observe(node);
      sentinelObserverRef.current = observer;
    },
    [increment, tree.length],
  );

  useEffect(() => () => sentinelObserverRef.current?.disconnect(), []);

  if (postsQ.isPending || reactionsQ.isPending) {
    return <PulseFeedSkeleton count={initial} />;
  }
  if (tree.length === 0) {
    return <p className="flex min-h-24 items-center justify-center text-center xnn-meta" data-nosnippet>No posts yet.</p>;
  }

  const hasMore = visible < tree.length;
  const meta = metaQ.data ?? EMPTY_META;

  return (
    <div data-nosnippet>
      <ul className="space-y-1 [overflow-anchor:none]">
        {sortedVisible.map((post) => (
          <PulseRow
            key={post.event.id}
            post={post}
            meta={meta}
            myVote={myVoteByTarget.get(post.event.id) ?? null}
            pollResponses={pollResponsesByParent.get(post.event.id) ?? []}
            rowRef={bindRowRef(post.event.id)}
            onVoteIntent={markHero}
          />
        ))}
      </ul>

      {hasMore && (
        <div ref={bindSentinelRef} aria-hidden="true" className="h-px w-full opacity-0 pointer-events-none" />
      )}
    </div>
  );
}

// PulseHot — homepage "post of the day"

export interface PulseHotProps {
  limit?: number;
  windowHours?: number;
}

export function PulseHot(props: PulseHotProps) {
  return (
    <NostrIsland>
      <PulseHotInner {...props} />
    </NostrIsland>
  );
}

function PulseHotInner({ limit = 3, windowHours = 72 }: PulseHotProps) {
  const since = useMemo(
    () => Math.floor(Date.now() / 1000) - windowHours * 60 * 60,
    [windowHours],
  );
  const user = useCurrentUser();
  const { postsQ, reactionsQ, metaQ, tree, myVoteByTarget, pollResponsesByParent } = usePulseFeed({ since, pubkey: user?.pubkey ?? null });
  const hotPosts = useMemo(() => tree.toSorted(byHot).slice(0, limit), [tree, limit]);

  if (postsQ.isPending || reactionsQ.isPending) return <PulseFeedSkeleton count={limit} />;
  if (hotPosts.length === 0) return null;

  const topEntry: PulseHotEntry = {
    post: hotPosts[0],
    myVote: myVoteByTarget.get(hotPosts[0].event.id) ?? null,
    pollResponses: pollResponsesByParent.get(hotPosts[0].event.id) ?? [],
  };

  return (
    <div data-nosnippet>
      {limit === 1 ? (
        <PulseHotSlot entry={topEntry} meta={metaQ.data ?? EMPTY_META} />
      ) : (
        <ul className="space-y-1">
          {hotPosts.map((post) => (
            <PulseRow
              key={post.event.id}
              post={post}
              meta={metaQ.data ?? EMPTY_META}
              myVote={myVoteByTarget.get(post.event.id) ?? null}
              pollResponses={pollResponsesByParent.get(post.event.id) ?? []}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
