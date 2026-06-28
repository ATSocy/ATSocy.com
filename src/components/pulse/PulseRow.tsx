import { memo, useRef, useState } from 'react';
import { usePublish } from '~/lib/nostr/usePublish';
import {
  authorNameFromMeta,
  displayCompactUrl,
  formatRelativeTime,
  reactionTemplate,
  summarize,
  thumbnailFor,
  providerThumbnail,
  imetaAltFor,
  optimisticVoteScore,
  isPollEvent,
  parsePollData,
  type PostNode,
} from '~/lib/nostr/events';
import { VoteButton, CommentIcon } from '~/components/article/VoteButton';
import { AuthorAvatar } from '~/components/article/AuthorAvatar';
import { Nip05Badge } from '~/components/identity/Nip05Badge';
import { PollBadge, PollRemainingTime, PollInline } from '~/components/pulse/PollCard';
import { PulseShareButton } from '~/components/pulse/PulseShareButton';
import type { NostrEvent } from '@nostrify/types';
import { cx } from '~/lib/ui/cx';
import { pulsePostHref } from '~/lib/pulse/routes';

import { ExternalLinkIcon } from '~/components/icons/ExternalLinkIcon';

const SKELETON_TITLE_WIDTHS = ['w-[68%]', 'w-[74%]', 'w-[61%]', 'w-[70%]'];
const SKELETON_BODY_WIDTHS = ['w-[92%]', 'w-[84%]', 'w-[88%]', 'w-[80%]'];

export interface PulseRowProps {
  post: PostNode;
  meta: NostrEvent[];
  myVote: 'up' | 'down' | null;
  /** Kind 1018 poll response events. Empty when the post is not a poll or not loaded. */
  pollResponses?: NostrEvent[];
  rowRef?: (el: HTMLElement | null) => void;
  onVoteIntent?: (id: string, direction: 'up' | 'down') => void;
  className?: string;
}

/**
 * PulseRow — one feed row. Optimistic vote state is frozen at click time so a
 * late relay result doesn't double-count (see `pending`); cleared via the
 * prev-prop pattern when the relay catches up to the optimistic direction.
 *
 * Stretched-link pattern: a real <a> covers the row for navigation, with
 * pointer-events on the article controlling which children capture clicks vs.
 * fall through. Accessible alternative to role="button" on an <article>
 * (which would also nest interactive elements illegally).
 */
export const PulseRow = memo(PulseRowImpl, (prev, next) =>
  prev.post.votes === next.post.votes
  && prev.post.replyCount === next.post.replyCount
  && prev.myVote === next.myVote
  && prev.meta === next.meta
  && prev.pollResponses === next.pollResponses,
);

function PulseRowImpl({ post, meta, myVote, pollResponses = [], rowRef, onVoteIntent, className }: PulseRowProps) {
  // Guard: malformed events from relays can lack required fields.
  if (!post?.event?.pubkey || !post?.event?.tags || typeof post?.event?.content !== 'string') return null;

  const publish = usePublish();

  // Freeze the optimistic score at click time. If we recalculate it against
  // live `post.votes`, the relay result can arrive while `pending` is still set
  // and briefly count the same vote twice.
  const [pending, setPending] = useState<{ vote: 'up' | 'down'; displayedVotes: number } | null>(null);

  // Clear `pending` once the relay catches up to the optimistic vote. Done in
  // render (prev-prop pattern) so we don't flash the stale value through an
  // extra render cycle. A ref is enough — the setPending() above triggers any
  // needed re-render. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const prevMyVoteRef = useRef(myVote);
  if (myVote !== prevMyVoteRef.current) {
    prevMyVoteRef.current = myVote;
    if (pending && myVote === pending.vote) setPending(null);
  }

  const vote = pending?.vote ?? myVote;

  const author = authorNameFromMeta(meta, post.event.pubkey);
  const thumbnail = thumbnailFor(post.event);
  const thumbnailAlt = imetaAltFor(post.event) ?? '';
  const summary = summarize(post.event.content);
  const linkThumb = summary.url ? providerThumbnail(summary.url) : null;
  const previewThumb = thumbnail ?? linkThumb;
  const displayedVotes = pending?.displayedVotes ?? post.votes;
  const pollData = isPollEvent(post.event) ? parsePollData(post.event) : null;

  // Publish a kind 7 reaction (NIP-25). Re-clicking the active direction is a
  // no-op — Nostr has no "unvote"; you can change direction, not erase it.
  async function onVote(next: 'up' | 'down') {
    if (vote === next) return;
    onVoteIntent?.(post.event.id, next);
    const effectiveVote = pending?.vote ?? myVote;
    const baseVotes = pending?.displayedVotes ?? post.votes;
    setPending({ vote: next, displayedVotes: optimisticVoteScore(baseVotes, effectiveVote, next) });
    try {
      await publish(reactionTemplate(post.event, next));
    } catch {
      setPending(null); // signer rejected / publish failed → revert
    }
  }

  const rowHref = pulsePostHref(post.event.id);
  const commentCount = post.replyCount;

  return (
    <li ref={rowRef} className={cx('relative', className)}>
      <a href={rowHref} className="absolute inset-0 z-0" aria-label={`Open post: ${summary.title}`} />

      <article
        className="pointer-events-none relative z-10 flex items-center gap-3 px-4 py-4 transition-colors hover:bg-raised/60 sm:gap-4 sm:px-8 lg:px-10"
      >
        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <VoteButton direction="up" active={vote === 'up'} className="pointer-events-auto" onClick={(e) => { e.stopPropagation(); void onVote('up'); }} />
          <span className={`text-body-sm font-semibold ${displayedVotes > 0 ? 'text-accent' : 'text-fg'}`}>{displayedVotes}</span>
          <VoteButton direction="down" active={vote === 'down'} className="pointer-events-auto" onClick={(e) => { e.stopPropagation(); void onVote('down'); }} />
        </div>

        {previewThumb && (
          <div className="relative h-24 w-24 shrink-0">
            <img
              src={previewThumb}
              alt={thumbnail ? thumbnailAlt : ''}
              aria-hidden={thumbnail ? undefined : true}
              className="h-full w-full rounded-[24px] corner-squircle object-cover"
              loading="lazy"
            />
            {linkThumb && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] corner-squircle bg-canvas/80 text-fg backdrop-blur-sm">
                  <PlayIcon />
                </span>
              </span>
            )}
            {summary.url && !linkThumb && (
              <span className="absolute bottom-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-[24px] corner-squircle bg-canvas/80 text-fg backdrop-blur-sm">
                <ExternalLinkIcon size={14} />
              </span>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 xnn-meta">
            <AuthorAvatar npub={author.npub} picture={author.picture} size={20} className="rounded-full" />
            <span className="text-fg-muted">{author.name}</span>
            <Nip05Badge pubkey={post.event.pubkey} nip05={author.nip05} />
            {summary.url && (
              <>
                <span className="inline-flex items-center text-accent sm:hidden" aria-label="External link">
                  <ExternalLinkIcon size={14} />
                </span>
                <span className="hidden max-w-[18rem] truncate text-accent xnn-caption sm:inline lg:max-w-[24rem]">{displayCompactUrl(summary.url)}</span>
              </>
            )}
            <span>{formatRelativeTime(post.event.created_at)}</span>
            {pollData && <PollBadge />}
            {pollData && <PollRemainingTime endsAt={pollData.endsAt} />}
          </div>

          <p className="xnn-copy">{summary.title}</p>

          {summary.body && <p className="mt-2 xnn-copy-sm text-fg-muted">{summary.body.replaceAll('\n', ' ')}</p>}

          {pollData && <PollInline event={post.event} responses={pollResponses} />}

          <div className="mt-3 flex flex-wrap items-center gap-4 xnn-meta">
            <button type="button" className="pointer-events-auto inline-flex items-center gap-1.5 cursor-pointer hover:text-fg" onClick={(e) => { e.stopPropagation(); window.location.href = rowHref; }} aria-label={`View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}>
              <CommentIcon />
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
            <PulseShareButton
              url={rowHref}
              nostrValue={`nostr:${post.event.id}`}
              triggerClassName="pointer-events-auto inline-flex h-7 w-7 items-center justify-center cursor-pointer text-fg-muted hover:text-fg"
              actionClassName="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-[12px] corner-squircle bg-canvas shadow-sm ring-1 ring-line text-fg-muted hover:text-fg"
              onTriggerClick={(e) => e.stopPropagation()}
              onActionClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </article>
    </li>
  );
}

function PulseRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <li aria-hidden="true">
      <article className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 lg:px-10">
        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <span className="xnn-skeleton-shimmer h-4 w-4 rounded-full" />
          <span className="xnn-skeleton-shimmer h-3 w-6 rounded-full" />
          <span className="xnn-skeleton-shimmer h-4 w-4 rounded-full" />
        </div>

        <div className="xnn-skeleton-shimmer h-24 w-24 shrink-0 rounded-[24px] corner-squircle" />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 xnn-meta">
            <span className="xnn-skeleton-shimmer h-5 w-5 rounded-full" />
            <span className="xnn-skeleton-shimmer h-3 w-24 rounded-full" />
            <span className="xnn-skeleton-shimmer h-3 w-10 rounded-full" />
            <span className="xnn-skeleton-shimmer hidden h-3 w-16 rounded-full sm:inline-block" />
          </div>

          <div className="space-y-2">
            <span className={`xnn-skeleton-shimmer block h-5 max-w-[32rem] rounded-full ${SKELETON_TITLE_WIDTHS[index % SKELETON_TITLE_WIDTHS.length]}`} />
            <span className={`xnn-skeleton-shimmer block h-4 max-w-[36rem] rounded-full ${SKELETON_BODY_WIDTHS[index % SKELETON_BODY_WIDTHS.length]}`} />
          </div>

          <div className="mt-3 flex items-center gap-4">
            <span className="xnn-skeleton-shimmer h-3 w-24 rounded-full" />
            <span className="xnn-skeleton-shimmer h-3 w-6 rounded-full" />
          </div>
        </div>
      </article>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82" />
    </svg>
  );
}

export function PulseFeedSkeleton({ count }: { count: number }) {
  return (
    <div data-nosnippet>
      <ul className="space-y-1">
        {Array.from({ length: count }).map((_, index) => (
          <PulseRowSkeleton key={index} index={index} />
        ))}
      </ul>
    </div>
  );
}
