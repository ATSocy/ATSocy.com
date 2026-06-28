import { useQuery } from '@tanstack/react-query';

/**
 * Verify a kind-0 `nip05` claim against `/.well-known/nostr.json` (NIP-05).
 * Returns `true` only when the published pubkey matches `names[local]` in the
 * well-known response. Failures (offline, malformed, mismatch) collapse to
 * `false` — never throw.
 *
 * Deduped across every caller by the `['nip05', pubkey, nip05]` query key, so
 * one author appearing many times in a feed = one fetch. Cached for the
 * session: nip05 mappings are effectively immutable.
 */
export function useNip05(pubkey: string, nip05: string | null): boolean {
  const query = useQuery({
    queryKey: ['nip05', pubkey, nip05 ?? ''],
    queryFn: async ({ signal }) => {
      if (!nip05) return false;
      const at = nip05.indexOf('@');
      // NIP-05 allows omitting the local part, which means `_@domain`.
      const local = at === -1 ? '_' : nip05.slice(0, at);
      const domain = at === -1 ? nip05 : nip05.slice(at + 1);
      if (!local || !domain) return false;

      const res = await fetch(
        `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(local)}`,
        { signal },
      );
      if (!res.ok) return false;
      const data = (await res.json()) as { names?: Record<string, string> };
      return data.names?.[local]?.toLowerCase() === pubkey.toLowerCase();
    },
    enabled: !!nip05,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  return query.data === true;
}
