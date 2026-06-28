import { useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import type { NostrEvent, NostrFilter } from '@nostrify/types';

/**
 * useNostrSubscription — keeps a live relay subscription open and appends
 * incoming events to a React Query cache entry. Unlike useNostrQuery (which
 * sends REQ, collects until EOSE, then closes), this holds the WebSocket
 * subscription open indefinitely so the feed updates in real time.
 *
 * queryKey  — the same key used by the companion useNostrQuery call
 * filters   — filters forwarded to nostr.req(); typically use `since: now`
 *             so you only stream new events rather than replaying history
 */
export function useNostrSubscription(
  queryKey: string[],
  filters: NostrFilter[],
  options?: { enabled?: boolean },
) {
  const { nostr } = useNostr();
  const qc = useQueryClient();
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function subscribe() {
      try {
        for await (const msg of nostr.req(filters, { signal: controller.signal })) {
          if (msg[0] !== 'EVENT') continue;
          const event = msg[2];
          if (typeof event === 'string') continue; // a relay notice, not an event
          qc.setQueryData<NostrEvent[]>(queryKey, (prev) => {
            if (!prev) return [event];
            if (prev.some((e) => e.id === event.id)) return prev;
            return [event, ...prev];
          });
        }
      } catch {
        // AbortError on cleanup — ignore
      }
    }

    void subscribe();
    return () => controller.abort();
    // `filters` and `queryKey` are caller-memoized; their identity already
    // captures content changes, so no separate stringify signature is needed.
  }, [enabled, nostr, qc, filters, queryKey]);
}
