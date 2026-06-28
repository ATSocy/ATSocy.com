import { keepPreviousData, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent, NostrFilter } from '@nostrify/types';

/**
 * useNostrQuery — query the shared Nostrify store with react-query. Gives
 * islands caching, dedup, and loading/error state. Pass a stable `queryKey` and
 * the filters to run.
 */
export function useNostrQuery(
  key: string[],
  filters: NostrFilter[],
  options?: Omit<UseQueryOptions<NostrEvent[]>, 'queryKey' | 'queryFn'>,
) {
  const { nostr } = useNostr();
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => nostr.query(filters, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}
