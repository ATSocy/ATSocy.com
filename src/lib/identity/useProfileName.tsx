import { useMemo } from 'react';
import { displayName } from '~/lib/nostr/events';
import type { NUser } from '@nostrify/react/login';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';

/**
 * useProfileName — fetch the active user's kind-0 metadata and resolve their
 * display name (`display_name`, else `name`, else `null`). Returns `null`
 * before any identity exists. Shared by the identity surfaces (UserMenu,
 * Pulse create-post) so the kind-0 query isn't duplicated at each call site.
 */
export function useProfileName(user: NUser | null): {
  /** Display name, or `null` when none is set / user is loading. */
  name: string | null;
  /** The raw kind-0 event content, for editors that preserve existing fields. */
  content: string | undefined;
} {
  const profileQ = useNostrQuery(
    ['nostr', 'profile', user?.pubkey ?? 'none'],
    user ? [{ kinds: [0], authors: [user.pubkey], limit: 1 }] : [],
    { enabled: !!user },
  );

  const name = useMemo(
    () => (user ? displayName(profileQ.data ?? [], user.pubkey) : null),
    [profileQ.data, user],
  );

  return { name, content: profileQ.data?.[0]?.content };
}
