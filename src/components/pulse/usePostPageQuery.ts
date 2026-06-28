import { useMemo } from 'react';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';
import { useNostrSubscription } from '~/lib/nostr/useNostrSubscription';
import type { NostrFilter } from '@nostrify/types';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/types';

export interface PostPageQueryOptions {
  /** Stable mount timestamp; the live subscription streams events since this. */
  since?: number;
  /** When false, skip both the query and the subscription. */
  enabled?: boolean;
  /** Extra react-query options (e.g. `refetchInterval`) for the query. */
  query?: Omit<UseQueryOptions<NostrEvent[]>, 'queryKey' | 'queryFn'>;
}

/**
 * usePostPageQuery — the recurring "fetch + live-stream" pair on the post
 * detail page. `PulsePostPage` wires four of these by hand (root, replies,
 * reactions, poll-responses); this collapses each to a single call.
 *
 * - `filters` is the EOSE-once query filter (pass `[]` to idle the query).
 * - `since` opens a live subscription streaming newer events into the same cache.
 *   Omit it (or pass `undefined`) for a query-only scope (root, meta).
 *
 * The returned object is the react-query result, so callers read `data`,
 * `isLoading`, `isFetching`, etc. exactly as before.
 */
export function usePostPageQuery(
  queryKey: string[],
  filters: NostrFilter[],
  options: PostPageQueryOptions = {},
) {
  const { since, enabled = true, query } = options;
  const liveFilters = useMemo(
    () => (since ? [{ ...filters[0], since }] : filters),
    [filters, since],
  );

  const result = useNostrQuery(queryKey, filters, { enabled, ...query });

  useNostrSubscription(queryKey, liveFilters, { enabled: enabled && since !== undefined });

  return result;
}
