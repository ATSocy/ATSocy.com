import type { ReactNode } from 'react';
import { NostrProvider } from '~/components/nostr/NostrProvider';
import { NostrLoginProvider } from '~/components/nostr/NostrLoginProvider';
import { useAutoGuestLogin } from '~/lib/identity/useAutoGuestLogin';

/**
 * NostrIsland — composes the two providers every Nostr-touching Astro island
 * needs: the relay pool + react-query client (NostrProvider) and the session
 * store (NostrLoginProvider). Both are module-singleton backed, so mounting
 * this more than once is structurally a no-op past the first island.
 *
 * Wrap an entry component with this instead of repeating the provider pair at
 * every export site.
 */
export function NostrIsland({ children }: { children: ReactNode }) {
  return (
    <NostrProvider>
      <NostrLoginProvider>
        <NostrSessionBootstrap>{children}</NostrSessionBootstrap>
      </NostrLoginProvider>
    </NostrProvider>
  );
}

function NostrSessionBootstrap({ children }: { children: ReactNode }) {
  useAutoGuestLogin();
  return <>{children}</>;
}
