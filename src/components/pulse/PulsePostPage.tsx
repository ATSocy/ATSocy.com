import { useEffect, useMemo, useRef } from 'react';
import { nip19 } from 'nostr-tools';
import { useNostrLogin } from '@nostrify/react/login';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { VoteButton, CommentIcon } from '~/components/article/VoteButton';
import { CommentRow, ReplyComposer } from '~/components/article/CommentParts';
import { AuthorAvatar } from '~/components/article/AuthorAvatar';
import { Nip05Badge } from '~/components/identity/Nip05Badge';
import { LinkCard } from '~/components/pulse/LinkCard';
import { PollBadge, PollRemainingTime, PollCard } from '~/components/pulse/PollCard';
import { PulseShareButton } from '~/components/pulse/PulseShareButton';
import { BouncingDotsLoader } from '~/components/ui/BouncingDotsLoader';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';
import { usePublish } from '~/lib/nostr/usePublish';
import { pulsePostHref } from '~/lib/pulse/routes';
import { clearPulsePost, takePulsePost } from '~/lib/pulse/post-cache';
import { usePostPageQuery } from './usePostPageQuery';
import { ATSOCY_CLIENT_TAG, ATSOCY_TOPICS, signerTag, withAtsocyTags } from '~/lib/nostr/atsocy-tags';
import {
  authorNameFromMeta,
  buildReplyTree,
  formatRelativeTime,
  imetaAltFor,
  isPollEvent,
  mediaUrlFor,
  myVotesByTarget,
  parsePollData,
  reactionTemplate,
  scoreReactions,
  summarize,
  thumbnailFor,
  mediaKindFor,
  providerThumbnail,
  totalCommentCount,
  type PostNode,
} from '~/lib/nostr/events';
import type { NostrEvent } from '@nostrify/types';

export interface PulsePostPageProps {
  /** Optional explicit note id; falls back to the `?note=` query param at runtime. */
  noteId?: string;
}

export function PulsePostPage({ noteId }: PulsePostPageProps) {
  return (
    <NostrIsland>
      <PulsePostPageInner noteId={noteId} />
    </NostrIsland>
  );
}

interface PulsePostPageInnerProps {
  noteId?: string;
}

function decodeNoteId(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'note') return decoded.data;
  } catch { /* not valid bech32 */ }
  return null;
}

function PulsePostPageInner({ noteId: noteIdProp }: PulsePostPageInnerProps) {
  const publish = usePublish();
  const user = useCurrentUser();
  const { logins } = useNostrLogin();
  const mountedAt = useRef(Math.floor(Date.now() / 1000));

  // Resolve the note id from the prop, falling back to the `?note=` query param.
  // This runs only on the client (the whole island is `client:only`), so reading
  // `window.location` here is safe — unlike the old wrapper, which touched it at
  // render of the exported component and would crash under SSR/prerender.
  const noteId = noteIdProp ?? new URL(window.location.href).searchParams.get('note') ?? '';

  const hexId = useMemo(() => decodeNoteId(noteId), [noteId]);

  const cachedEvent = useMemo(() => (hexId ? takePulsePost(hexId) : null), [hexId]);

  const key = (scope: string) => ['nostr', 'post', hexId ?? 'invalid', scope] as string[];

  // `hexId` resolves before this render path runs (see the early `if (!hexId)`
  // below); filters are built from it directly so they never carry a sentinel
  // empty id. The `enabled` flags keep queries off until it resolves.
  const rootFilter = useMemo(
    () => (hexId ? [{ ids: [hexId] }] : []),
    [hexId],
  );
  const repliesFilter = useMemo(
    () => (hexId ? [{ kinds: [1], '#e': [hexId] }] : []),
    [hexId],
  );

  const rootQ = usePostPageQuery(key('root'), rootFilter, {
    enabled: Boolean(hexId),
    query: { refetchInterval: (q) => (q.state.data?.length ? false : 2000) },
  });

  const repliesQ = usePostPageQuery(key('replies'), repliesFilter, {
    enabled: Boolean(hexId),
    since: mountedAt.current,
  });

  const rootEvent = rootQ.data?.[0] ?? cachedEvent ?? undefined;

  useEffect(() => {
    if (rootQ.data?.[0] && hexId) clearPulsePost(hexId);
  }, [rootQ.data, hexId]);

  const allIds = useMemo(() => {
    const ids: string[] = [];
    if (hexId) ids.push(hexId);
    for (const r of repliesQ.data ?? []) ids.push(r.id);
    return ids;
  }, [hexId, repliesQ.data]);

  const reactionsFilter = useMemo(
    () => (allIds.length > 0 ? [{ kinds: [7], '#e': allIds }] : []),
    [allIds],
  );

  const reactionsQ = usePostPageQuery(key('reactions'), reactionsFilter, {
    enabled: allIds.length > 0,
    since: mountedAt.current,
  });

  // Poll responses (kind 1018) — only queried when the root is a poll.
  const isPoll = rootEvent ? isPollEvent(rootEvent) : false;
  const pollResponsesFilter = useMemo(
    () => (hexId ? [{ kinds: [1018], '#e': [hexId] }] : []),
    [hexId],
  );

  const pollResponsesQ = usePostPageQuery(key('poll-responses'), pollResponsesFilter, {
    enabled: Boolean(hexId) && isPoll,
    since: mountedAt.current,
  });

  const allPubkeys = useMemo(() => {
    const set = new Set<string>();
    if (rootEvent) set.add(rootEvent.pubkey);
    for (const e of repliesQ.data ?? []) set.add(e.pubkey);
    return [...set];
  }, [rootEvent, repliesQ.data]);

  const metaFilter = useMemo(
    () => (allPubkeys.length > 0 ? [{ kinds: [0], authors: allPubkeys }] : []),
    [allPubkeys],
  );

  const metaQ = useNostrQuery(key('meta'), metaFilter, {
    enabled: allPubkeys.length > 0,
  });

  const scores = useMemo(
    () => scoreReactions(reactionsQ.data ?? []),
    [reactionsQ.data],
  );

  const rootVotes = rootEvent ? (scores.get(rootEvent.id) ?? 0) : 0;

  const commentForest = useMemo<PostNode[]>(
    () => buildReplyTree(repliesQ.data ?? [], scores),
    [repliesQ.data, scores],
  );

  const myVoteByTarget = useMemo(
    () => (user ? myVotesByTarget(reactionsQ.data ?? [], user.pubkey) : new Map<string, 'up' | 'down'>()),
    [reactionsQ.data, user],
  );

  const pollEndsAt = useMemo(
    () => (rootEvent && isPoll ? parsePollData(rootEvent)?.endsAt ?? null : null),
    [rootEvent, isPoll],
  );

  if (!hexId) return <p className="px-6 py-8 text-fg-muted">Invalid note ID.</p>;
  if (!rootEvent && (rootQ.isLoading || rootQ.isFetching)) {
    return (
      <div className="flex min-h-[42rem] flex-col items-center justify-center gap-6 py-16">
        <BouncingDotsLoader />
      </div>
    );
  }
  if (!rootEvent) return <p className="px-6 py-8 text-fg-muted">Post not found.</p>;

  const summary = summarize(rootEvent.content);
  const thumbnail = thumbnailFor(rootEvent);
  const thumbnailAlt = imetaAltFor(rootEvent) ?? '';
  const mediaUrl = mediaUrlFor(rootEvent);
  const mediaKind = mediaKindFor(rootEvent);
  const linkThumb = summary.url ? providerThumbnail(summary.url) : null;
  const author = authorNameFromMeta(metaQ.data ?? [], rootEvent.pubkey);
  const permalink = pulsePostHref(rootEvent.id);
  const tags = rootEvent.tags.reduce<string[]>((acc, t) => {
    if (t[0] === 't' && t[1]) acc.push(t[1]);
    return acc;
  }, []);
  const commentCount = totalCommentCount(commentForest);

  async function vote(event: NostrEvent, direction: 'up' | 'down') {
    const current = myVoteByTarget.get(event.id);
    if (current === direction) return;
    await publish(reactionTemplate(event, direction));
  }

  async function reply(toEvent: NostrEvent, text: string) {
    const root = rootEvent!;
    const eTags = root.id === toEvent.id
      ? [['e', root.id, '', 'root']]
      : [['e', root.id, '', 'root'], ['e', toEvent.id, '', 'reply']];
    await publish({
      kind: 1,
      content: text,
      tags: withAtsocyTags([...eTags, ['p', toEvent.pubkey, '']], ATSOCY_TOPICS.pulse),
    });
  }

  async function pollVote(optionId: string) {
    if (!rootEvent || !isPoll) return;
    // `client` stays reserved for app identity (ATSocy); how the vote was signed
    // (disposable guest nsec vs. NIP-07 extension) is recorded under atsocy-signer.
    const signer = logins[0]?.type === 'nsec' ? 'guest' : 'nip07';
    const tags: string[][] = [
      ['e', rootEvent.id],
      ['response', optionId],
      [ATSOCY_CLIENT_TAG[0], ATSOCY_CLIENT_TAG[1]],
      signerTag(signer),
    ];
    await publish({ kind: 1018, content: '', tags });
  }

  return (
    <div data-nosnippet className="px-6 py-8 sm:px-8 lg:px-10">
      {/* Root post */}
      <article>
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 xnn-meta">
            <AuthorAvatar npub={author.npub} picture={author.picture} size={24} className="rounded-full" />
            <span className="font-medium text-fg">{author.name}</span>
            <Nip05Badge pubkey={rootEvent.pubkey} nip05={author.nip05} />
            {isPoll && <PollBadge />}
            {isPoll && <PollRemainingTime endsAt={pollEndsAt} />}
            <span className="text-fg-muted">{formatRelativeTime(rootEvent.created_at)}</span>
          </div>

          <h1 className="xnn-heading-md">{summary.title}</h1>
          {mediaUrl && mediaKind === 'video' && (
            <video
              src={mediaUrl}
              poster={thumbnail && thumbnail !== mediaUrl ? thumbnail : undefined}
              aria-label={thumbnailAlt}
              className="atsocy-media"
              controls
              playsInline
            />
          )}
          {thumbnail && mediaKind !== 'video' && (
            <img
              src={thumbnail}
              alt={thumbnailAlt}
              className="atsocy-media mt-4"
              loading="lazy"
            />
          )}
          {linkThumb && summary.url && (
            <a href={summary.url} target="_blank" rel="noopener noreferrer" className="atsocy-media-link">
              <span className="atsocy-media-wrap">
                <img
                  src={linkThumb}
                  alt=""
                  aria-hidden="true"
                  className="atsocy-media mt-4"
                  loading="lazy"
                />
                <span className="atsocy-media-play">
                  <PlayIcon />
                </span>
              </span>
            </a>
          )}
          {summary.url && <LinkCard url={summary.url} />}
          {summary.body && (
            <p className="mt-4 whitespace-pre-wrap text-body-lg text-fg">{summary.body}</p>
          )}

          {isPoll && (
            <div className="mt-6 max-w-xl">
              <PollCard
                event={rootEvent}
                responses={pollResponsesQ.data ?? []}
                onVote={(optionId) => void pollVote(optionId)}
              />
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 xnn-meta text-fg-subtle">
              {tags.map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1.5">
                  <TagIcon />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <VoteButton direction="up" active={myVoteByTarget.get(rootEvent.id) === 'up'} onClick={() => void vote(rootEvent, 'up')} />
              <span className={`min-w-[2rem] text-center text-body-sm font-semibold ${rootVotes > 0 ? 'text-accent' : 'text-fg'}`}>{rootVotes}</span>
              <VoteButton direction="down" active={myVoteByTarget.get(rootEvent.id) === 'down'} onClick={() => void vote(rootEvent, 'down')} />
            </div>
            <span className="inline-flex items-center gap-1.5 xnn-meta text-fg-muted">
              <CommentIcon />
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
            <PulseShareButton
              url={permalink}
              nostrValue={`nostr:${rootEvent.id}`}
              triggerClassName="inline-flex h-7 w-7 items-center justify-center cursor-pointer text-fg-muted hover:text-fg"
              actionClassName="inline-flex h-7 w-7 items-center justify-center rounded-[12px] corner-squircle bg-canvas shadow-sm ring-1 ring-line text-fg-muted hover:text-fg"
            />
          </div>
        </div>
      </article>

      {/* Reply composer for root post */}
      <div className="mt-6 max-w-3xl">
        <ReplyComposer
          placeholder="Write a comment…"
          onSubmit={(text) => reply(rootEvent, text)}
          disabled={!user}
        />
      </div>

      {/* Comment tree */}
      <div className="mt-6 space-y-4">
        {commentForest.map((comment) => (
          <CommentRow
            key={comment.event.id}
            comment={comment}
            meta={metaQ.data ?? []}
            myVoteByTarget={myVoteByTarget}
            onVote={vote}
            onReply={reply}
          />
        ))}
        {commentForest.length === 0 && (
          <p className="py-8 text-center xnn-meta text-fg-muted">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 overflow-visible">
      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
        <path d="M11.216 6.282a.75.75 0 0 1 .502.934l-.61 2.034h3.434l.74-2.466a.75.75 0 0 1 1.436.432l-.61 2.034H18a.75.75 0 0 1 0 1.5h-2.342l-.75 2.5H17a.75.75 0 0 1 0 1.5h-2.542l-.74 2.465a.75.75 0 0 1-1.436-.43l.61-2.035H9.458l-.74 2.465a.75.75 0 1 1-1.436-.43l.61-2.035H6a.75.75 0 0 1 0-1.5h2.342l.75-2.5H7a.75.75 0 0 1 0-1.5h2.542l.74-2.466a.75.75 0 0 1 .934-.502m-.558 4.468h3.434l-.75 2.5H9.908z"></path>
        <path d="M11.943 1.25c-2.309 0-4.118 0-5.53.19c-1.444.194-2.584.6-3.479 1.494c-.895.895-1.3 2.035-1.494 3.48c-.19 1.411-.19 3.22-.19 5.529v.114c0 2.309 0 4.118.19 5.53c.194 1.444.6 2.584 1.494 3.479c.895.895 2.035 1.3 3.48 1.494c1.411.19 3.22.19 5.529.19h.114c2.309 0 4.118 0 5.53-.19c1.444-.194 2.584-.6 3.479-1.494c.895-.895 1.3-2.035 1.494-3.48c.19-1.411.19-3.22.19-5.529v-.114c0-2.309 0-4.118-.19-5.53c-.194-1.444-.6-2.584-1.494-3.479c-.895-.895-2.035-1.3-3.48-1.494c-1.411-.19-3.22-.19-5.529-.19zM3.995 3.995c.57-.57 1.34-.897 2.619-1.069c1.3-.174 3.008-.176 5.386-.176s4.086.002 5.386.176c1.279.172 2.05.5 2.62 1.069c.569.57.896 1.34 1.068 2.619c.174 1.3.176 3.008.176 5.386s-.002 4.086-.176 5.386c-.172 1.279-.5 2.05-1.069 2.62c-.57.569-1.34.896-2.619 1.068c-1.3.174-3.008.176-5.386.176s-4.086-.002-5.386-.176c-1.279-.172-2.05-.5-2.62-1.069c-.569-.57-.896-1.34-1.068-2.619c-.174-1.3-.176-3.008-.176-5.386s.002-4.086.176-5.386c.172-1.279.5-2.05 1.069-2.62"></path>
      </g>
    </svg>
  );
}
