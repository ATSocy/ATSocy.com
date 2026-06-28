/**
 * Canonical Nostr view-layer helpers. One implementation of every operation the
 * Pulse/Community surfaces perform on raw events: NIP-10 reply trees, NIP-22
 * comment trees, NIP-25 reaction scoring, kind-0 author metadata, post-text
 * summarization, and time formatting. NIP-88 poll logic lives in
 * `./events/polls` and is re-exported below.
 *
 * All functions are pure — they take events and return data. Components consume
 * them; nothing here touches React, gsap, or the network.
 */
import { nip19 } from 'nostr-tools';
import { shortNpub } from '~/lib/identity/nostr-identity';
import { ATSOCY_TOPICS, withAtsocyTags } from '~/lib/nostr/atsocy-tags';
import type { NostrEvent } from '@nostrify/types';

// Types

/** A reply-tree node. `replyCount` is the recursive total (computed at build). */

export interface PostNode {
  event: NostrEvent;
  votes: number;
  replies: PostNode[];
  replyCount: number;
}

export interface AuthorMeta {
  name: string;
  npub: string;
  /** Kind-0 `picture` URL, or null (guests have none → alien avatar used). */
  picture: string | null;
  /** Kind-0 `nip05` as published, or null. Verification is the caller's job. */
  nip05: string | null;
}

export interface PostSummary {
  title: string;
  body: string | null;
  url: string | null;
}

/** An unsigned event template — no id/pubkey/sig; `created_at` is added at sign time. */
export type PublishTemplate = Omit<NostrEvent, 'id' | 'pubkey' | 'sig' | 'created_at'>;

// Tag helpers

/** Last `e` tag's id from a NIP-10 positional tag set, or null. */
export function lastETag(event: NostrEvent): string | null {
  let last: string | null = null;
  for (const t of event.tags) {
    if (t[0] === 'e' && t[1]) last = t[1];
  }
  return last;
}

/**
 * NIP-25 reaction publish tags. Same shape used everywhere we publish a kind 7:
 * `['e', target, '', pubkey], ['p', pubkey, ''], ['k', kind]`. The kind tag
 * reflects the *target's* kind so consumers can filter reactions per type.
 */
function reactionTags(target: NostrEvent): string[][] {
  return [
    ['e', target.id, '', target.pubkey],
    ['p', target.pubkey, ''],
    ['k', String(target.kind)],
  ];
}

/** Build a kind 7 reaction template for `target`. */
export function reactionTemplate(target: NostrEvent, direction: 'up' | 'down'): PublishTemplate {
  return {
    kind: 7,
    content: direction === 'up' ? '+' : '-',
    tags: reactionTags(target),
  };
}

// NIP-25 scoring

const REACTION_SCORE: Record<string, number> = { '+': 1, '': 1, '-': -1 };

/** Reaction delta: +1 for upvote, -1 for downvote. Unknown → 0. */
function reactionDelta(content: string): number {
  return REACTION_SCORE[content] ?? 0;
}

/** Score contribution of a user's vote direction (optimistic UI + scoring). */
export function voteContribution(v: 'up' | 'down' | null): number {
  if (v === 'up') return 1;
  if (v === 'down') return -1;
  return 0;
}

/**
 * Optimistic score after changing vote. Uses pending base when mid-flight.
 * Fresh votes apply full contribution; switching direction moves one step
 * (up→down on a solo upvote goes 1→0, not 1→−1).
 */
export function optimisticVoteScore(
  baseVotes: number,
  currentVote: 'up' | 'down' | null,
  next: 'up' | 'down',
): number {
  if (currentVote === next) return baseVotes;
  if (currentVote === null) return baseVotes + voteContribution(next);
  if (currentVote === 'up' && next === 'down') return baseVotes - 1;
  if (currentVote === 'down' && next === 'up') return baseVotes + 1;
  return baseVotes;
}

/** Pick the latest reaction per (target, pubkey) from a list. */
function latestReactions(reactions: NostrEvent[]): Map<string, NostrEvent> {
  const latest = new Map<string, NostrEvent>(); // `${target}:${pubkey}` → reaction
  for (const r of reactions) {
    if (!(r.content in REACTION_SCORE)) continue;
    const target = lastETag(r);
    if (!target) continue;
    const key = `${target}:${r.pubkey}`;
    const prev = latest.get(key);
    if (!prev || r.created_at > prev.created_at) latest.set(key, r);
  }
  return latest;
}

/**
 * Net reaction score per target id. Latest reaction per (target, pubkey) wins;
 * display-only content (emoji etc.) is ignored.
 */
export function scoreReactions(reactions: NostrEvent[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const r of latestReactions(reactions).values()) {
    const target = lastETag(r)!;
    scores.set(target, (scores.get(target) ?? 0) + reactionDelta(r.content));
  }
  return scores;
}

/** The active user's latest vote per target. */
export function myVotesByTarget(
  reactions: NostrEvent[],
  pubkey: string,
): Map<string, 'up' | 'down'> {
  const out = new Map<string, 'up' | 'down'>();
  for (const r of latestReactions(reactions.filter((x) => x.pubkey === pubkey)).values()) {
    const targetId = lastETag(r);
    if (!targetId) continue;
    out.set(targetId, r.content === '-' ? 'down' : 'up');
  }
  return out;
}

// NIP-10 reply tree

/**
 * Build a reply tree from kind 1 events using NIP-10 positional `e` tags
 * (last `e` tag is the direct parent). Roots are returned in input order;
 * `replyCount` is the recursive total per node.
 */
export function buildReplyTree(posts: NostrEvent[], scores: Map<string, number>): PostNode[] {
  const byId = new Map<string, PostNode>();
  for (const event of posts) {
    byId.set(event.id, { event, votes: scores.get(event.id) ?? 0, replies: [], replyCount: 0 });
  }
  const roots: PostNode[] = [];
  for (const event of posts) {
    const node = byId.get(event.id)!;
    const parent = lastETag(event);
    if (parent && byId.has(parent)) byId.get(parent)!.replies.push(node);
    else roots.push(node);
  }
  for (const root of roots) computeReplyCount(root);
  return roots;
}

function computeReplyCount(node: PostNode): number {
  let count = 0;
  for (const r of node.replies) count += 1 + computeReplyCount(r);
  node.replyCount = count;
  return count;
}

/** Dedupe events by id (e.g. when merging `#A` and `#a` query results). */
export function dedupeEvents(events: NostrEvent[]): NostrEvent[] {
  const seen = new Set<string>();
  const out: NostrEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    out.push(event);
  }
  return out;
}

/** NIP-23 replaceable address for an editorial article. */
export function articleAddress(pubkey: string, slug: string): string {
  return `30023:${pubkey}:${slug}`;
}

/** Slug from a `30023:pubkey:slug` address, or null. */
export function slugFromArticleAddress(addr: string): string | null {
  const parts = addr.split(':');
  if (parts.length < 3 || parts[0] !== '30023') return null;
  return parts.slice(2).join(':');
}

/**
 * Build a NIP-22 comment tree (kind 1111). Top-level comments parent the
 * article; nested replies parent another comment (lowercase `k` = 1111).
 */
export function buildCommentTree(events: NostrEvent[], scores: Map<string, number>): PostNode[] {
  const byId = new Map<string, PostNode>();
  for (const event of events) {
    byId.set(event.id, { event, votes: scores.get(event.id) ?? 0, replies: [], replyCount: 0 });
  }
  const roots: PostNode[] = [];
  for (const event of events) {
    const node = byId.get(event.id)!;
    const parentId = commentParentId(event);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  for (const root of roots) computeReplyCount(root);
  roots.sort((a, b) => b.votes - a.votes || a.event.created_at - b.event.created_at);
  for (const root of roots) sortCommentReplies(root);
  return roots;
}

function commentParentId(event: NostrEvent): string | null {
  const parentKind = event.tags.find((t) => t[0] === 'k')?.[1];
  if (parentKind !== '1111') return null;
  return event.tags.find((t) => t[0] === 'e' && t[1])?.[1] ?? null;
}

function sortCommentReplies(node: PostNode): void {
  node.replies.sort((a, b) => b.votes - a.votes || a.event.created_at - b.event.created_at);
  for (const reply of node.replies) sortCommentReplies(reply);
}

/** Total comments in a NIP-22 forest (roots + all nested replies). */
export function totalCommentCount(forest: PostNode[]): number {
  return forest.reduce((n, c) => n + 1 + c.replyCount, 0);
}

/** Publish template for a NIP-22 article comment (kind 1111). */
export function articleCommentTemplate(opts: {
  slug: string;
  editorialPubkey: string;
  articleEventId: string;
  content: string;
  relayHint?: string;
  parent?: NostrEvent;
}): PublishTemplate {
  const hint = opts.relayHint ?? '';
  const addr = articleAddress(opts.editorialPubkey, opts.slug);
  const rootTags: string[][] = [
    ['A', addr, hint],
    ['E', opts.articleEventId, hint, opts.editorialPubkey],
    ['K', '30023'],
    ['P', opts.editorialPubkey, hint],
  ];

  if (opts.parent) {
    return {
      kind: 1111,
      content: opts.content,
      tags: withAtsocyTags([
        ...rootTags,
        ['e', opts.parent.id, hint, opts.parent.pubkey],
        ['k', '1111'],
        ['p', opts.parent.pubkey, hint],
      ], ATSOCY_TOPICS.comments),
    };
  }

  return {
    kind: 1111,
    content: opts.content,
    tags: withAtsocyTags([
      ...rootTags,
      ['a', addr, hint],
      ['e', opts.articleEventId, hint, opts.editorialPubkey],
      ['k', '30023'],
      ['p', opts.editorialPubkey, hint],
    ], ATSOCY_TOPICS.comments),
  };
}

// Kind-0 author metadata

function parseMeta(event: NostrEvent | undefined): {
  name?: string;
  display_name?: string;
  picture?: string;
  nip05?: string;
} | null {
  if (!event?.content) return null;
  try {
    return JSON.parse(event.content) as {
      name?: string;
      display_name?: string;
      picture?: string;
      nip05?: string;
    };
  } catch {
    return null;
  }
}

/** Author display info, falling back to a truncated npub for the name. */
export function authorNameFromMeta(events: NostrEvent[], pubkey: string): AuthorMeta {
  const npub = nip19.npubEncode(pubkey);
  const parsed = parseMeta(events.find((e) => e.pubkey === pubkey));
  return {
    name: parsed?.display_name || parsed?.name || shortNpub(npub),
    npub,
    picture: parsed?.picture || null,
    nip05: parsed?.nip05 || null,
  };
}

/** Display name only — `null` when neither `display_name` nor `name` is set. */
export function displayName(events: NostrEvent[], pubkey: string): string | null {
  const parsed = parseMeta(events.find((e) => e.pubkey === pubkey));
  return parsed?.display_name || parsed?.name || null;
}

// Post text

const URL_RE = /https?:\/\/\S+/;
const IMAGE_URL_RE = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]\S*)?$/i;

/** First http(s) URL in `text`, or null. */
export function firstUrl(text: string): string | null {
  return text.match(URL_RE)?.[0] ?? null;
}

/**
 * Direct CDN thumbnail URL for known providers, served as a plain image with
 * no fetch/proxy required. Returns null for unsupported or unparsable URLs —
 * callers fall back to a plain link chip.
 *
 * Supported: YouTube (incl. youtu.be, /shorts/, /live/). Reddit's thumbnail
 * CDNs (b.thumbs.redditmedia.com, external-preview.redd.it) return 403 to
 * unauthenticated requests, so Reddit is intentionally unsupported.
 */
export function providerThumbnail(url: string): string | null {
  try {
    const p = new URL(url);
    const host = p.hostname.replace(/^www\./, '');

    // YouTube video id extraction across the three URL shapes.
    let videoId: string | null = null;
    if (host === 'youtu.be') {
      videoId = p.pathname.slice(1).split('/')[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (p.pathname === '/watch') videoId = p.searchParams.get('v');
      else if (p.pathname.startsWith('/shorts/') || p.pathname.startsWith('/live/') || p.pathname.startsWith('/embed/')) {
        videoId = p.pathname.split('/')[2] || null;
      }
    }

    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  } catch {
    return null;
  }
}

/** First URL in `text` that looks like an image, or null. */
function firstImageUrl(text: string): string | null {
  return text.match(/https?:\/\/\S+/g)?.find((u) => IMAGE_URL_RE.test(u)) ?? null;
}

/** Compact hostname+path (+query when meaningful) for display. */
export function displayUrl(url: string): string {
  try {
    const p = new URL(url);
    const path = p.pathname === '/' ? '' : p.pathname;
    // YouTube watch links carry their content in ?v=, not the path. Show the
    // query for that case so the chip isn't a bare "youtube.com/watch".
    const showQuery = p.hostname.endsWith('youtube.com') && p.pathname === '/watch';
    return `${p.hostname}${path}${showQuery ? `?${p.searchParams}` : ''}`;
  } catch {
    return url;
  }
}

/**
 * Split raw kind-1 content into a title (first non-empty line), body (the
 * remaining lines joined with `\n`), and a URL. The body is `null` when there
 * are no further lines. Callers that want single-line body can `.replaceAll('\n', ' ')`.
 */
export function summarize(content: string): PostSummary {
  const url = firstUrl(content);
  const withoutUrl = url ? content.replace(url, '').trim() : content.trim();
  const lines = withoutUrl.split(/\n+/).flatMap((l) => {
    const t = l.trim();
    return t ? [t] : [];
  });
  const [first, ...rest] = lines;
  return {
    title: first || (url ? displayUrl(url) : 'Untitled post'),
    body: rest.join('\n') || null,
    url,
  };
}

/**
 * Thumbnail URL for an event: explicit `thumb`/`thumbnail`/`image` tag wins,
 * then `imeta`'s `thumb` field, then a derived Blossom thumbnail for videos,
 * then `imeta`'s `url` field, then the first image URL in content.
 */
export function thumbnailFor(event: NostrEvent): string | null {
  for (const tag of event.tags) {
    if (tag[0] === 'thumb' || tag[0] === 'thumbnail' || tag[0] === 'image') return tag[1] ?? null;
    if (tag[0] === 'imeta') {
      let url: string | null = null;
      let mime: string | null = null;
      for (const part of tag.slice(1)) {
        const thumb = part.match(/^thumb\s+(.+)$/);
        if (thumb) return thumb[1];
        const m = part.match(/^url\s+(.+)$/);
        if (m) url = m[1];
        const mm = part.match(/^m\s+(.+)$/);
        if (mm) mime = mm[1];
      }
      const derivedThumb = deriveBlossomThumbUrl(url, mime);
      if (derivedThumb) return derivedThumb;
      if (url) return url;
    }
  }
  return firstImageUrl(event.content);
}

/** Original media URL for the first attachment, if any. */
export function mediaUrlFor(event: NostrEvent): string | null {
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    for (const part of tag.slice(1)) {
      const match = part.match(/^url\s+(.+)$/);
      if (match) return match[1];
    }
  }
  return firstImageUrl(event.content);
}

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg|mkv)(?:[?#]\S*)?$/i;

/** Media kind for the first attachment: `image`, `video`, or `null` (unknown). */
export function mediaKindFor(event: NostrEvent): 'image' | 'video' | null {
  const url = mediaUrlFor(event);
  if (!url) return null;

  // NIP-92 `m` (mimetype) field takes precedence over URL extension.
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    for (const part of tag.slice(1)) {
      const mm = part.match(/^m\s+(.+)$/);
      if (!mm) continue;
      const mime = mm[1];
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
    }
  }

  if (IMAGE_URL_RE.test(url)) return 'image';
  if (VIDEO_EXT_RE.test(url)) return 'video';
  return null;
}

/** NIP-92 `imeta` alt text for the first media attachment, if any. */
export function imetaAltFor(event: NostrEvent): string | null {
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    for (const part of tag.slice(1)) {
      const match = part.match(/^alt\s+(.+)$/);
      if (match) return match[1];
    }
  }
  return null;
}

function deriveBlossomThumbUrl(url: string | null, mime: string | null): string | null {
  if (!url || !mime?.startsWith('video/')) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/([0-9a-f]{64})(?:\.[a-z0-9]+)?$/i);
    if (!match) return null;
    return `${parsed.origin}/thumb/${match[1].toLowerCase()}.webp`;
  } catch {
    return null;
  }
}

// Time

/**
 * Short "x ago" formatter: `5s`, `12m`, `3h`, `4d`, `2w`. Single canonical
 * implementation — used everywhere timestamps appear in feed/sidebar UI.
 *
 * Takes epoch *seconds* (the Nostr convention). Pass `Date.now()/1000` for
 * "now" or convert ISO strings via `Math.floor(new Date(iso).getTime()/1000)`.
 */
export function formatRelativeTime(createdSeconds: number): string {
  const diffSeconds = Math.max(1, Math.floor(Date.now() / 1000) - createdSeconds);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffSeconds < 3_600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3_600)}h`;
  if (diffSeconds < 604_800) return `${Math.floor(diffSeconds / 86_400)}d`;
  return `${Math.floor(diffSeconds / 604_800)}w`;
}

// Sorting

/**
 * "hot" = votes × 1000 + recency (seconds / 1e6) — rough HN-style blend.
 * Higher score first.
 */
function byHotScore(a: PostNode, b: PostNode): number {
  return b.votes * 1000 + b.event.created_at / 1e6 - (a.votes * 1000 + a.event.created_at / 1e6);
}

/**
 * Canonical hot sort with deterministic tie-breaking. All clients must agree
 * on the same ordering for same-score posts, otherwise the visible "top" row
 * can diverge between sessions depending on subscription/query arrival order.
 *
 * Ties are broken by recency first, then by event id for a final canonical
 * order that does not depend on input order.
 */
export function byHot(a: PostNode, b: PostNode): number {
  const hot = byHotScore(a, b);
  if (hot !== 0) return hot;
  if (b.event.created_at !== a.event.created_at) return b.event.created_at - a.event.created_at;
  return a.event.id.localeCompare(b.event.id);
}

// NIP-88 polls — extracted to `./events/polls`. Re-exported here so the
// single `~/lib/nostr/events` import path keeps covering every domain.
export {
  isPollEvent,
  parsePollData,
  formatRemainingTime,
  titleTag,
  countPollResponses,
  countPollResponsesByClient,
  myPollVotes,
  pollOptionBreakdown,
  type PollOption,
  type PollData,
  type PollClientCounts,
  type PollOptionBreakdown,
} from './events/polls';
