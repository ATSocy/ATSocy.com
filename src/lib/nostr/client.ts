/**
 * Nostrify client. Single `NPool` over the configured relays, shared by all
 * islands via NostrContext. When USE_MOCK_EVENTS is true (UI authoring phase),
 * the pool is backed by an in-memory relay seeded with mock events instead of
 * real relay connections — so the islands use the exact same `query()` API
 * against mock data.
 *
 * See docs/SITE-ARCHITECTURE.md and docs/NOSTR-EVENTS.md.
 */
import { NCache, NPool, NRelay1, type NRelay, type NStore } from '@nostrify/nostrify';
import { NOSTR_RELAYS, USE_MOCK_EVENTS } from '~/config/feeds';
import { MOCK_COMMUNITY, MOCK_EDITORIAL, MOCK_METADATA, MOCK_PULSE, MOCK_POLL_VOTES } from '~/lib/nostr/mock-events';
import type { NostrEvent, NostrFilter, NostrRelayCLOSED, NostrRelayEOSE, NostrRelayEVENT } from '@nostrify/types';

/** Wrap an in-memory store as a minimal NRelay so NPool can route to it. */
function memoryRelay(store: NStore): NRelay {
  return {
    async query(filters: NostrFilter[], opts?: { signal?: AbortSignal }) {
      return store.query(filters, opts);
    },
    async *req(filters: NostrFilter[]): AsyncIterable<NostrRelayEVENT | NostrRelayEOSE | NostrRelayCLOSED> {
      const events = await store.query(filters);
      for (const event of events) yield ['EVENT', '', event] as NostrRelayEVENT;
      yield ['EOSE', ''] as NostrRelayEOSE;
    },
    async event(evt: NostrEvent) {
      await store.event(evt);
    },
    async close() {
      /* no-op for in-memory relay */
    },
  };
}

function buildMockStore(): NStore {
  const store = new NCache({ max: 5000 });
  const all: NostrEvent[] = [
    ...MOCK_METADATA,
    ...MOCK_COMMUNITY,
    ...MOCK_PULSE.posts,
    ...MOCK_PULSE.reactions,
    ...MOCK_POLL_VOTES,
    ...MOCK_EDITORIAL,
  ];
  for (const event of all) void store.event(event);
  return store;
}

// Module-level singleton pool shared by every island on a page.
let _pool: NPool | undefined;
let _mockStore: NStore | undefined;

function getMockStore(): NStore {
  if (!_mockStore) _mockStore = buildMockStore();
  return _mockStore;
}

export function getNostr(): NPool {
  if (_pool) return _pool;

  if (USE_MOCK_EVENTS) {
    _pool = new NPool({
      open: () => memoryRelay(getMockStore()),
      reqRouter: (filters) => new Map([['mock://local', filters]]),
      eventRouter: () => ['mock://local'],
    });
    return _pool;
  }

  const relays = [...NOSTR_RELAYS];
  if (relays.length === 0) {
    // Mock disabled but no relays configured — use an empty in-memory pool so
    // the UI renders its empty state rather than throwing.
    _pool = new NPool({
      open: () => memoryRelay(new NCache({ max: 100 })),
      reqRouter: (filters) => new Map([['memory://local', filters]]),
      eventRouter: () => ['memory://local'],
    });
    return _pool;
  }

  _pool = new NPool({
    open(url) {
      return new NRelay1(url);
    },
    reqRouter(filters) {
      return new Map(relays.map((url) => [url, filters]));
    },
    eventRouter() {
      return relays;
    },
  });
  return _pool;
}
