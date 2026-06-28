import { type NLoginType, type NLoginStorage } from '@nostrify/react/login';
// Access the internal context + reducer (not in public exports) via Vite alias
// to the dist path. Same module instance the library uses → context identity
// is preserved, so useNostrLogin() sees our provider.
// @ts-expect-error — resolved by Vite alias; TS doesn't see the path mapping.
import { NostrLoginContext, type NostrLoginContextType } from '@nostrify/react/dist/login/NostrLoginContext.js';
import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Shared localStorage key for Nostr logins. Astro islands cannot share React
 * context across boundaries, so every island that needs the session mounts this
 * provider with the same key and reads/writes one persisted store.
 */
const NOSTR_LOGIN_STORAGE_KEY = 'atsocy:nostr-logins';

// Server-safe storage: uses real localStorage on the client, no-op stub on SSR.
const safeStorage: NLoginStorage =
  globalThis.localStorage ?? {
    getItem: () => null,
    setItem: () => {},
  };

function readStoredLogins(): NLoginType[] {
  try {
    const stored = safeStorage.getItem(NOSTR_LOGIN_STORAGE_KEY);
    const raw = typeof stored === 'string' ? stored : null;
    return raw ? (JSON.parse(raw) as NLoginType[]) : [];
  } catch {
    return [];
  }
}

// Module-level shared store
// Astro islands have separate React roots, so React context doesn't cross
// boundaries. This module-level store + useSyncExternalStore ensures every
// island sees the same login state: when one island adds/removes a login,
// all subscribed providers re-render simultaneously.

// Stable empty array — avoids React's getServerSnapshot reference-equality
// warning when useSyncExternalStore returns a new [] on every SSR call.
const EMPTY_LOGINS: NLoginType[] = [];

let _logins: NLoginType[] = typeof window !== 'undefined' ? readStoredLogins() : EMPTY_LOGINS;
const _listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function persistAndNotify(): void {
  safeStorage.setItem(NOSTR_LOGIN_STORAGE_KEY, JSON.stringify(_logins));
  _listeners.forEach((l) => l());
}

/** Re-read localStorage into the module store (client navigation / hydration). */
function syncLoginsFromStorage(): void {
  if (typeof window === 'undefined') return;
  const stored = readStoredLogins();
  if (stored.length === _logins.length && stored.every((l, i) => l.id === _logins[i]?.id)) return;
  _logins = stored;
  _listeners.forEach((l) => l());
}

/**
 * NostrLoginProvider — replacement for Nostrify's provider that reads storage
 * synchronously (SSR-safe) instead of in `useEffect`. Nostrify's built-in
 * provider initializes `initialLogins = null` and reads storage in an effect,
 * which doesn't run during SSR — causing children to be replaced by `fallback`
 * (null) and blocking all NostrIsland content from server-rendering. By reading
 * storage in the `useState` initializer, the context is populated on first
 * render so feed islands (PulseHot, Pulse) can SSR their skeleton and avoid
 * layout collapse on refresh.
 *
 * Uses a module-level store + useSyncExternalStore so login changes in one
 * Astro island (e.g. UserMenu generating a new guest) propagate to all other
 * islands (e.g. Pulse) instantly.
 */
export function NostrLoginProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncLoginsFromStorage();
  }, []);

  const logins = useSyncExternalStore(subscribe, () => _logins, () => EMPTY_LOGINS);

  const addLogin = useCallback((login: NLoginType) => {
    _logins = [login, ..._logins.filter((l) => l.id !== login.id)];
    persistAndNotify();
  }, []);

  const removeLogin = useCallback((loginId: string) => {
    _logins = _logins.filter((l) => l.id !== loginId);
    persistAndNotify();
  }, []);

  const setLogin = useCallback((loginId: string) => {
    const idx = _logins.findIndex((l) => l.id === loginId);
    if (idx <= 0) return;
    const next = [..._logins];
    const [login] = next.splice(idx, 1);
    next.unshift(login);
    _logins = next;
    persistAndNotify();
  }, []);

  const clearLogins = useCallback(() => {
    _logins = [];
    persistAndNotify();
  }, []);

  const value: NostrLoginContextType = {
    logins,
    addLogin,
    removeLogin,
    setLogin,
    clearLogins,
  };

  return <NostrLoginContext.Provider value={value}>{children}</NostrLoginContext.Provider>;
}
