import { useMemo, useRef } from 'react';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { CommentIcon } from '~/components/article/VoteButton';
import { CommentRow, ReplyComposer } from '~/components/article/CommentParts';
import { ATS_PUBKEY, NOSTR_RELAYS } from '~/config/feeds';
import {
  articleCommentTemplate,
  buildCommentTree,
  myVotesByTarget,
  reactionTemplate,
  scoreReactions,
  totalCommentCount,
} from '~/lib/nostr/events';
import { useArticleComments } from '~/lib/articles/useArticleComments';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { useNostrQuery } from '~/lib/nostr/useNostrQuery';
import { useNostrSubscription } from '~/lib/nostr/useNostrSubscription';
import { usePublish } from '~/lib/nostr/usePublish';
import type { NostrEvent } from '@nostrify/types';

export interface ArticleCommentsProps {
  slug: string;
  nostrEventId?: string;
}

export function ArticleComments({ slug, nostrEventId }: ArticleCommentsProps) {
  return (
    <NostrIsland>
      <ArticleCommentsInner slug={slug} nostrEventId={nostrEventId} />
    </NostrIsland>
  );
}

function ArticleCommentsInner({ slug, nostrEventId }: ArticleCommentsProps) {
  const publish = usePublish();
  const user = useCurrentUser();
  const relayHint = NOSTR_RELAYS[0] ?? '';
  const mountedAt = useRef(Math.floor(Date.now() / 1000));

  const { comments, articleEvent, isLoading } = useArticleComments(slug, nostrEventId);

  const commentIds = useMemo(() => comments.map((c) => c.id), [comments]);

  const reactionsQueryKey = ['nostr', 'article', slug, 'reactions'];

  const reactionsQ = useNostrQuery(
    reactionsQueryKey,
    [{ kinds: [7], '#e': commentIds.length > 0 ? commentIds : ['none'] }],
    { enabled: commentIds.length > 0 },
  );

  useNostrSubscription(
    reactionsQueryKey,
    [{ kinds: [7], since: mountedAt.current }],
    { enabled: commentIds.length > 0 },
  );

  const allPubkeys = useMemo(() => [...new Set(comments.map((c) => c.pubkey))], [comments]);

  const metaQ = useNostrQuery(
    ['nostr', 'article', slug, 'meta'],
    [{ kinds: [0], authors: allPubkeys.length > 0 ? allPubkeys : ['none'] }],
    { enabled: allPubkeys.length > 0 },
  );

  const scores = useMemo(() => scoreReactions(reactionsQ.data ?? []), [reactionsQ.data]);

  const commentForest = useMemo(
    () => buildCommentTree(comments, scores),
    [comments, scores],
  );

  const myVoteByTarget = useMemo(
    () => (user ? myVotesByTarget(reactionsQ.data ?? [], user.pubkey) : new Map<string, 'up' | 'down'>()),
    [reactionsQ.data, user],
  );

  const commentCount = totalCommentCount(commentForest);
  const articleEventId = articleEvent?.id ?? nostrEventId;
  const canCompose = Boolean(user && articleEventId);
  const composerPlaceholder = user ? 'Write a comment…' : 'Loading account…';

  // No Nostr article event means there's nowhere to anchor a new kind-1111
  // comment thread. Hide the section entirely once the lookup has settled.
  if (!isLoading && !articleEventId && commentForest.length === 0) {
    return null;
  }

  async function vote(event: NostrEvent, direction: 'up' | 'down') {
    const current = myVoteByTarget.get(event.id);
    if (current === direction) return;
    await publish(reactionTemplate(event, direction));
  }

  async function reply(toEvent: NostrEvent | null, text: string) {
    if (!articleEventId) return;
    await publish(articleCommentTemplate({
      slug,
      editorialPubkey: ATS_PUBKEY,
      articleEventId,
      content: text,
      relayHint,
      parent: toEvent && toEvent.kind === 1111 ? toEvent : undefined,
    }));
  }

  return (
    <section id="comments" data-nosnippet className="mt-12 border-t border-line pt-10">
      <h2 className="mb-6 flex items-center gap-2 xnn-heading-sm">
        <CommentIcon size={18} />
        {isLoading ? 'Comments' : `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
      </h2>

      <div className="max-w-3xl">
        <ReplyComposer
          placeholder={composerPlaceholder}
          submitLabel="Comment"
          onSubmit={(text) => reply(null, text)}
          disabled={!canCompose}
        />
      </div>

      <div className="mt-8 space-y-4">
        {isLoading && commentForest.length === 0 && (
          <p className="py-8 text-center xnn-meta text-fg-muted">Loading comments…</p>
        )}
        {commentForest.map((comment) => (
          <CommentRow
            key={comment.event.id}
            comment={comment}
            meta={metaQ.data ?? []}
            myVoteByTarget={myVoteByTarget}
            onVote={vote}
            onReply={(event, text) => reply(event, text)}
          />
        ))}
        {!isLoading && commentForest.length === 0 && (
          <p className="py-8 text-center xnn-meta text-fg-muted">No comments yet.</p>
        )}
      </div>
    </section>
  );
}
