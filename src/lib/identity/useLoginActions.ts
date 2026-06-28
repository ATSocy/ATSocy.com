import { NLogin, useNostrLogin, type NLoginType } from '@nostrify/react/login';
import { generateGuestIdentity } from '~/lib/identity/nostr-identity';

/**
 * useLoginActions — login mutations bound to the shared login store. Each
 * `login*` method adds a login and makes it the active one (index 0). The
 * `UserMenu` calls `loginGuest()` automatically on first visit.
 */
export function useLoginActions() {
  const { logins, addLogin, setLogin, removeLogin } = useNostrLogin();

  function activate(login: NLoginType) {
    addLogin(login);
    setLogin(login.id);
  }

  return {
    /** Create and activate a fresh random identity. */
    loginGuest() {
      const { nsec } = generateGuestIdentity();
      const login = NLogin.fromNsec(nsec);
      activate(login);
    },
    /** Activate the identity from a NIP-07 browser extension, if present. */
    async loginExtension() {
      activate(await NLogin.fromExtension());
    },
    /** Remove the current identity. The `UserMenu` auto-creates a new guest. */
    signOut() {
      const current = logins[0];
      if (current) removeLogin(current.id);
    },
  };
}
