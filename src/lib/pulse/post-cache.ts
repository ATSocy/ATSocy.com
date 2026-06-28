import type { NostrEvent } from '@nostrify/types';

/**
 * Optimistic hand-off between the post composer and the post detail page.
 *
 * When `PulseCreatePostPage` publishes a post, it caches the event under
 * `pulse:event:<hexId>` so `PulsePostPage` can render it immediately — before
 * any relay has returned it via the root query. Once the root query resolves,
 * the cache entry is cleared.
 *
 * This module owns the single source of the storage key and the stored shape so
 * the writer and reader can't drift apart (the old code had three copy-pasted
 * string literals and an unvalidated `as NostrEvent` cast).
 */
const KEY = (hexId: string) => `pulse:event:${hexId}`;

/** Cache a just-published event so the detail page can render before relay return. */
export function cachePulsePost(event: NostrEvent): void {
  try {
    sessionStorage.setItem(KEY(event.id), JSON.stringify(event));
  } catch { /* sessionStorage unavailable (private mode / quota) — non-fatal */ }
}

/**
 * Take (read) a cached event for `hexId`. Returns null when absent or when the
 * stored value isn't a structurally-valid Nostr event (guards against a stale
 * or tampered entry instead of blindly casting).
 */
export function takePulsePost(hexId: string): NostrEvent | null {
  try {
    const raw = sessionStorage.getItem(KEY(hexId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isNostrEvent(parsed) ? parsed : null;
  } catch { return null; }
}

/** Clear the optimistic cache once the real relay data has arrived. */
export function clearPulsePost(hexId: string): void {
  try {
    sessionStorage.removeItem(KEY(hexId));
  } catch { /* ignore */ }
}

function isNostrEvent(value: unknown): value is NostrEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as NostrEvent).id === 'string' &&
    typeof (value as NostrEvent).pubkey === 'string' &&
    typeof (value as NostrEvent).kind === 'number' &&
    typeof (value as NostrEvent).content === 'string' &&
    Array.isArray((value as NostrEvent).tags) &&
    typeof (value as NostrEvent).created_at === 'number' &&
    typeof (value as NostrEvent).sig === 'string'
  );
}
