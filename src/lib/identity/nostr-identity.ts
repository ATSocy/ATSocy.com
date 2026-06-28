import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

export interface GuestIdentity {
  secretKey: Uint8Array;
  pubkey: string;
  npub: string;
  nsec: `nsec1${string}`;
}

/**
 * Generate a fresh, random Nostr identity. The site creates one automatically on
 * first visit so every visitor has a real identity to participate with, and can
 * optionally replace it with their own key later (see `UserMenu`).
 *
 * Keys are generated client-side and persisted by `NostrLoginProvider` to
 * localStorage; nothing is sent anywhere until the user posts something.
 */
export function generateGuestIdentity(): GuestIdentity {
  const secretKey = generateSecretKey();
  const pubkey = getPublicKey(secretKey);
  const nsec = nip19.nsecEncode(secretKey);
  const npub = nip19.npubEncode(pubkey);
  return { secretKey, pubkey, npub, nsec };
}

/** Compact npub for display, e.g. `npub1abc…wxyz`. */
export function shortNpub(npub: string, head = 10, tail = 8): string {
  if (npub.length <= head + tail + 1) return npub;
  return `${npub.slice(0, head)}…${npub.slice(-tail)}`;
}
