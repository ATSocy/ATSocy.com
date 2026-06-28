import { useNostrLogin } from '@nostrify/react/login';
import { useEffect, useState } from 'react';
import { useLoginActions } from '~/lib/identity/useLoginActions';
import { useNip07ExtensionState } from '~/lib/identity/useNip07Extension';

/**
 * Ensures every visitor has a guest identity after hydration. Also replaces a
 * stale extension login when the browser extension is no longer available.
 */
export function useAutoGuestLogin() {
  const { logins } = useNostrLogin();
  const actions = useLoginActions();
  const { available: hasExtension, ready: extensionReady } = useNip07ExtensionState();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => setClientReady(true), []);

  const staleExtension = extensionReady
    && logins[0]?.type === 'extension'
    && !hasExtension;

  useEffect(() => {
    if (!clientReady) return;
    if (logins.length === 0 || staleExtension) actions.loginGuest();
    // oxlint-disable-next-line react-doctor/exhaustive-deps — stable dispatch; adding it would loop.
  }, [clientReady, logins.length, staleExtension]);
}
