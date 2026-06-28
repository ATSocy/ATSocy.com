import { useNostr } from '@nostrify/react';
import { NUser, useNostrLogin } from '@nostrify/react/login';
import { useMemo } from 'react';

/**
 * useCurrentUser — resolve the active Nostr user (pubkey + signer) from the
 * current login. The first login in the store is "current". Returns `null`
 * before any identity exists; `UserMenu` auto-creates a guest identity on first
 * load, so in practice this is populated after the first effect tick.
 *
 * Mirrors `@nostrify/react`'s `useCurrentUser` example, trimmed to what we use.
 */
export function useCurrentUser() {
  const { nostr } = useNostr();
  const { logins } = useNostrLogin();

  return useMemo<NUser | null>(() => {
    const login = logins[0];
    if (!login) return null;
    switch (login.type) {
      case 'nsec':
        return NUser.fromNsecLogin(login);
      case 'bunker':
        return NUser.fromBunkerLogin(login, nostr);
      case 'extension':
        return NUser.fromExtensionLogin(login);
      default:
        return null;
    }
  }, [logins, nostr]);
}
