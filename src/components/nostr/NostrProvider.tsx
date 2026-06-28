import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrContext } from '@nostrify/react';
import { useMemo, useRef, type ReactNode } from 'react';
import { getNostr } from '~/lib/nostr/client';

// Module-level QueryClient so every island shares one cache. Lazily constructed
// on first use so importing the module alone has no side effects.
let _queryClient: QueryClient | undefined;
function getQueryClient(): QueryClient {
  if (!_queryClient) _queryClient = new QueryClient();
  return _queryClient;
}

/**
 * NostrProvider — wraps children in the shared Nostrify store + QueryClient.
 * The store and client are module-level singletons (see lib/nostr.ts), so even
 * if multiple islands each mount their own provider, they share state. Each
 * nostr-fed island wraps itself in this so it can stay an independent Astro
 * `client:*` island.
 */
export function NostrProvider({ children }: { children: ReactNode }) {
  // Lazy-init refs so getNostr()/getQueryClient() only run on first render.
  const nostrRef = useRef<ReturnType<typeof getNostr> | null>(null);
  if (nostrRef.current === null) nostrRef.current = getNostr();
  const queryRef = useRef<QueryClient | null>(null);
  if (queryRef.current === null) queryRef.current = getQueryClient();

  // Stable context value so consumers don't re-render on every NostrProvider render.
  const value = useMemo(() => ({ nostr: nostrRef.current! }), []);

  return (
    <NostrContext.Provider value={value}>
      <QueryClientProvider client={queryRef.current!}>{children}</QueryClientProvider>
    </NostrContext.Provider>
  );
}
