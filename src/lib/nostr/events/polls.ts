/**
 * NIP-88 poll view-layer helpers (kind 1068 polls / kind 1018 responses).
 *
 * Pure functions: parse poll events, count responses (option totals and the
 * Alien-vs-Guest client split), and compute per-option display math. Nothing
 * here touches React, gsap, or the network.
 */
import type { NostrEvent } from '@nostrify/types';

/** Parsed poll option from a kind 1068 event. */
export interface PollOption {
  /** The option ID as it appears in the `option` tag (e.g. "opt_a1b2c3"). */
  id: string;
  /** Human-readable option label. */
  label: string;
}

/** Parsed poll data from a kind 1068 event. Null when the event is not a poll. */
export interface PollData {
  /** Poll options, in order of appearance. */
  options: PollOption[];
  /** `singlechoice` or `multiplechoice`. */
  pollType: 'singlechoice' | 'multiplechoice';
  /** End time as epoch seconds. Null when not set (never-ending poll). */
  endsAt: number | null;
}

/** Check whether a NostrEvent is a poll (kind 1068). */
export function isPollEvent(event: NostrEvent): boolean {
  return event.kind === 1068;
}

/**
 * Parse poll data from a kind 1068 event. Returns null for non-poll events.
 * Looks at `option`, `polltype`, and `endsAt` tags.
 */
export function parsePollData(event: NostrEvent): PollData | null {
  if (event.kind !== 1068) return null;

  const options: PollOption[] = [];
  let pollType: 'singlechoice' | 'multiplechoice' = 'singlechoice';
  let endsAt: number | null = null;

  for (const tag of event.tags) {
    if (tag[0] === 'option' && tag[1] && tag[2]) {
      options.push({ id: tag[1], label: tag[2] });
    }
    if (tag[0] === 'polltype') {
      pollType = tag[1] === 'multiplechoice' ? 'multiplechoice' : 'singlechoice';
    }
    if (tag[0] === 'endsAt' && tag[1]) {
      const n = Number(tag[1]);
      if (Number.isFinite(n)) endsAt = n;
    }
  }

  if (options.length === 0) return null;
  return { options, pollType, endsAt };
}

/**
 * Format the remaining time until `endsAt` (epoch seconds).
 * Returns a short human-readable string like "2h 30m" or "3d 12h", or null
 * if the poll has already ended or has no end time.
 */
export function formatRemainingTime(endsAt: number | null): string | null {
  if (endsAt === null) return null;
  const remaining = Math.max(0, Math.floor(endsAt - Date.now() / 1000));
  if (remaining <= 0) return null;

  const days = Math.floor(remaining / 86_400);
  const hours = Math.floor((remaining % 86_400) / 3_600);
  const minutes = Math.floor((remaining % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Parse a kind 1068 event's `title` tag. Null when no `title` tag is set. */
export function titleTag(event: NostrEvent): string | null {
  for (const tag of event.tags) {
    if (tag[0] === 'title' && tag[1]) return tag[1];
  }
  return null;
}

/**
 * Latest kind-1018 poll response per pubkey (one vote per pubkey, per NIP-88).
 * Responses that aren't kind 1018 or don't reference `pollEventId` are ignored.
 */
function latestPollResponses(responses: NostrEvent[], pollEventId: string): Map<string, NostrEvent> {
  const latest = new Map<string, NostrEvent>();
  for (const r of responses) {
    if (r.kind !== 1018) continue;
    if (!r.tags.some((t) => t[0] === 'e' && t[1] === pollEventId)) continue;
    const prev = latest.get(r.pubkey);
    if (!prev || r.created_at > prev.created_at) latest.set(r.pubkey, r);
  }
  return latest;
}

function responseTagIds(event: NostrEvent): string[] {
  return event.tags.filter((t) => t[0] === 'response' && t[1]).map((t) => t[1]);
}

/**
 * Count poll responses per option from kind 1018 events. One vote per pubkey
 * (latest wins, per NIP-88). Returns a Map from option ID to count.
 */
export function countPollResponses(
  responses: NostrEvent[],
  pollEventId: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of latestPollResponses(responses, pollEventId).values()) {
    for (const id of responseTagIds(r)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

/** Per-option vote breakdown by client type (guest vs extension). */
export interface PollClientCounts {
  guest: number;
  extension: number;
}

/**
 * Count poll responses per option, split by client type. Responses with
 * `['client', 'guest']` tag count as guest votes; all others as extension.
 * One vote per pubkey (latest wins, per NIP-88).
 */
export function countPollResponsesByClient(
  responses: NostrEvent[],
  pollEventId: string,
): Map<string, PollClientCounts> {
  const counts = new Map<string, PollClientCounts>();
  for (const r of latestPollResponses(responses, pollEventId).values()) {
    const isGuest = r.tags.some((t) => t[0] === 'client' && t[1] === 'guest');
    const bucket = isGuest ? 'guest' : 'extension';
    for (const id of responseTagIds(r)) {
      const existing = counts.get(id) ?? { guest: 0, extension: 0 };
      existing[bucket]++;
      counts.set(id, existing);
    }
  }
  return counts;
}

/** Get the option IDs a pubkey voted for in a poll. Empty when not voted. */
export function myPollVotes(
  responses: NostrEvent[],
  pollEventId: string,
  pubkey: string,
): string[] {
  const latest = latestPollResponses(responses, pollEventId).get(pubkey);
  return latest ? responseTagIds(latest) : [];
}

/** One option's share of the vote, split by Alien (extension) vs Guest. */
export interface PollOptionBreakdown {
  /** Vote count for this option. */
  count: number;
  /** Whole-poll percentage for this option (rounded, 0–100). */
  percentage: number;
  /** Alien (extension) share of the percentage. */
  alienPct: number;
  /** Guest share of the percentage (`percentage - alienPct`). */
  guestPct: number;
}

/**
 * Per-option vote breakdown for a poll. The single source of the
 * "alien bar fills to total %, guest overlays from the left" math shared by
 * `PollCard` (detail) and `PollInline` (compact). `totalVotes` is the poll's
 * grand total (sum of every option's count); `alienCount` is this option's
 * Alien (extension) vote count.
 */
export function pollOptionBreakdown(
  count: number,
  alienCount: number,
  totalVotes: number,
): PollOptionBreakdown {
  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  const alienPct = totalVotes > 0 ? Math.round((alienCount / totalVotes) * 100) : 0;
  return { count, percentage, alienPct, guestPct: percentage - alienPct };
}
