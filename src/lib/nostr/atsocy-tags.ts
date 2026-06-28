/**
 * ATSocy attribution tags — the single source of truth for the `t` topic tags
 * and the NIP-89-style client tag stamped onto every event the app authors.
 *
 * Pure data + one pure helper, no external imports, so this can be shared by
 * both the browser islands (Pulse composer, article comments) and the Node
 * publishing script (`scripts/publish-nostr.ts`) without dragging in React,
 * nostr-tools, or the `~` path alias.
 */

/** NIP-89-style client tag identifying ATSocy as the authoring app. */
export const ATSOCY_CLIENT_TAG: readonly [string, string] = ['client', 'ATSocy'];

/** Topic (`t`) tag values per ATSocy-authored surface. */
export const ATSOCY_TOPICS = {
  /** Pulse posts, polls, and replies (kind 1 / 1068). */
  pulse: 'atsocy-pulse',
  /** Editorial/article comments (kind 1111). */
  comments: 'atsocy-comments',
  /** Long-form editorial articles (kind 30023). */
  editorial: 'atsocy-editorial',
} as const;

export type AtsocyTopic = (typeof ATSOCY_TOPICS)[keyof typeof ATSOCY_TOPICS];

/**
 * App-specific tag key recording how an ATSocy event was signed. `client` is
 * reserved for app identity (`ATSocy`) everywhere, so signer provenance —
 * disposable guest nsec vs. a NIP-07 extension — lives under its own key.
 */
export const ATSOCY_SIGNER_TAG = 'atsocy-signer';

export type AtsocySigner = 'guest' | 'nip07';

/** Build the `['atsocy-signer', signer]` tag for an event the app signs. */
export function signerTag(signer: AtsocySigner): [string, string] {
  return [ATSOCY_SIGNER_TAG, signer];
}

/**
 * Append ATSocy attribution tags to an existing tag list: the `['t', topic]`
 * topic tag followed by the client tag, each skipped when already present.
 *
 * Deterministic — existing tags keep their order, and the topic tag is appended
 * before the client tag — so the same input always yields the same output.
 */
export function withAtsocyTags(tags: string[][], topic: AtsocyTopic): string[][] {
  const out = [...tags];
  if (!out.some((t) => t[0] === 't' && t[1] === topic)) {
    out.push(['t', topic]);
  }
  if (!out.some((t) => t[0] === ATSOCY_CLIENT_TAG[0] && t[1] === ATSOCY_CLIENT_TAG[1])) {
    out.push([ATSOCY_CLIENT_TAG[0], ATSOCY_CLIENT_TAG[1]]);
  }
  return out;
}
