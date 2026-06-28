import { nip19 } from 'nostr-tools';
import {
  PUBLIC_NOSTR_RELAYS,
  PUBLIC_HOT_PULSE_WINDOW_HOURS,
  PUBLIC_ATS_NPUB,
} from 'astro:env/client';

export type RelayUrl = `ws://${string}` | `wss://${string}`;

const DEFAULT_NOSTR_RELAYS: readonly RelayUrl[] = import.meta.env.DEV
  ? ['ws://127.0.0.1:7777']
  : [];

function parseRelayList(input: string | undefined): readonly RelayUrl[] {
  if (!input) return DEFAULT_NOSTR_RELAYS;

  return input
    .split(',')
    .map((relay) => relay.trim())
    .filter((relay): relay is RelayUrl => relay.startsWith('ws://') || relay.startsWith('wss://'));
}

/**
 * Live signal-layer configuration — the single source of truth for the Dev
 * Activity, Community, and Pulse rails. These streams are client-fetched
 * at runtime (see docs/SITE-ARCHITECTURE.md); static articles are NOT here —
 * they live in the `news`, `kya`, and `guides` content collections.
 *
 * Defaults are safe for local UI work. Real relay URLs can be injected at build
 * time with PUBLIC_NOSTR_RELAYS.
 */
export const NOSTR_RELAYS = parseRelayList(PUBLIC_NOSTR_RELAYS);

/** Curated Community rail whitelist (npubs). Thin, hand-curated feed. */
export const COMMUNITY_AUTHORS = [
  // npubs of whitelisted note/tweet authors
] as const satisfies readonly string[];

/** Limits applied client-side to each rail. `pulseInitial` is the first-paint
 *  cap before Pulse switches to infinite scroll. */
export const FEED_LIMITS = {
  devActivity: 26,
  community: 14,
  pulseInitial: 12,
  pulseIncrement: 12,
} as const;

/**
 * When true, the live islands render mock Nostr events instead of querying
 * relays. Useful while authoring the UI before real relays/whitelists are wired
 * (and the basis for component tests). Set PUBLIC_USE_MOCK_EVENTS=true locally.
 */
export const USE_MOCK_EVENTS =
  import.meta.env.PUBLIC_USE_MOCK_EVENTS === 'true' || import.meta.env.PUBLIC_USE_MOCK_EVENTS === '1';

/** Homepage Hot Pulse window, in hours. Override with PUBLIC_HOT_PULSE_WINDOW_HOURS. */
export const HOT_PULSE_WINDOW_HOURS = PUBLIC_HOT_PULSE_WINDOW_HOURS ?? 72;

/** ATSocy editorial pubkey (kind 30023). Override with PUBLIC_ATS_NPUB for local relay dev. */
const DEFAULT_ATS_NPUB = 'npub1hjn08rv4ymjgtpr6uzechwmzcfhet457vczxy8qlq2xaq836mutsp737yw';
export const ATS_NPUB = PUBLIC_ATS_NPUB?.trim() || DEFAULT_ATS_NPUB;
export const ATS_PUBKEY = decodeNpub(ATS_NPUB);

function decodeNpub(npub: string): string {
  const decoded = nip19.decode(npub);
  if (decoded.type !== 'npub') throw new Error(`Expected npub, got ${decoded.type}`);
  return decoded.data;
}
