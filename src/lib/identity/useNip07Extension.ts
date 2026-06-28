import { useEffect, useState } from 'react';

/** Match NIP-07 surface used by `NLogin.fromExtension()` / `NBrowserSigner`. */
function nip07Available(): boolean {
  if (typeof window === 'undefined') return false;
  const nostr = window.nostr;
  return (
    typeof nostr?.getPublicKey === 'function'
    || typeof nostr?.signEvent === 'function'
  );
}

/** How long we wait for a late-injecting NIP-07 extension before giving up. */
const EXTENSION_POLL_MS = 10_000;

export interface Nip07ExtensionState {
  /** `window.nostr` is present and usable. */
  available: boolean;
  /** Initial poll finished — safe to treat a missing extension as genuinely absent. */
  ready: boolean;
}

/**
 * Detect a NIP-07 browser extension. Many inject `window.nostr` after first
 * paint, so we poll briefly instead of reading only on initial render.
 */
export function useNip07ExtensionState(): Nip07ExtensionState {
  const [available, setAvailable] = useState(() => nip07Available());
  const [ready, setReady] = useState(() => nip07Available());

  useEffect(() => {
    if (available) {
      setReady(true);
      return;
    }

    if (nip07Available()) {
      setAvailable(true);
      setReady(true);
      return;
    }

    const deadline = Date.now() + EXTENSION_POLL_MS;
    const id = window.setInterval(() => {
      if (nip07Available()) {
        setAvailable(true);
        setReady(true);
        window.clearInterval(id);
      } else if (Date.now() > deadline) {
        setReady(true);
        window.clearInterval(id);
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [available]);

  return { available, ready };
}
