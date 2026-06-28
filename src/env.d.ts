/// <reference types="astro/client" />
import type { WindowNostr } from 'nostr-tools';

declare global {
  interface Window {
    /** NIP-07 browser signer, injected by extensions (e.g. Flamingo). */
    nostr?: WindowNostr;
  }
}
