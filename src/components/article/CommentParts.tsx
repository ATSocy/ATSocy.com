import { useState } from 'react';
import { VoteButton, CommentIcon } from '~/components/article/VoteButton';
import { AuthorAvatar } from '~/components/article/AuthorAvatar';
import { Nip05Badge } from '~/components/identity/Nip05Badge';
import { authorNameFromMeta, formatRelativeTime, type PostNode } from '~/lib/nostr/events';
import type { NostrEvent } from '@nostrify/types';

const CONTROL = 'w-full rounded-[24px] corner-squircle border border-line bg-canvas px-5 py-4 text-body text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-accent';
const BTN_SOLID = 'inline-flex items-center justify-center rounded-[24px] corner-squircle bg-accent px-5 py-3 text-body-sm font-medium text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50';
const BTN_GHOST = 'inline-flex items-center gap-1.5 rounded-[18px] corner-squircle px-3 py-2 text-body-sm font-medium text-fg-muted transition-colors hover:bg-raised hover:text-fg';

export function ReplyComposer({
  placeholder, onSubmit, onCancel, disabled, submitLabel = 'Reply',
}: {
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  disabled: boolean;
  submitLabel?: string;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setText('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <textarea
        className={`${CONTROL} min-h-24 resize-y`}
        aria-label={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || busy}
        rows={3}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className={BTN_SOLID}
          disabled={disabled || busy || !text.trim()}
          onClick={() => void submit()}
        >
          {busy ? 'Posting…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={BTN_GHOST} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function CommentRow({
  comment, meta, myVoteByTarget, onVote, onReply,
}: {
  comment: PostNode;
  meta: NostrEvent[];
  myVoteByTarget: Map<string, 'up' | 'down'>;
  onVote: (event: NostrEvent, direction: 'up' | 'down') => void;
  onReply: (event: NostrEvent, text: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const author = authorNameFromMeta(meta, comment.event.pubkey);
  const hasReplies = comment.replies.length > 0;
  const myVote = myVoteByTarget.get(comment.event.id) ?? null;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <AuthorAvatar npub={author.npub} picture={author.picture} size={36} className="rounded-full" />
        {hasReplies && (
          <div className="mt-2 w-px flex-1 bg-line/40" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div className="mb-1 flex flex-wrap items-center gap-2 xnn-meta">
          <span className="font-medium text-fg">{author.name}</span>
          <Nip05Badge pubkey={comment.event.pubkey} nip05={author.nip05} />
          <span className="text-fg-muted">{formatRelativeTime(comment.event.created_at)}</span>
        </div>

        <p className="whitespace-pre-wrap text-body text-fg">{comment.event.content}</p>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <VoteButton direction="up" active={myVote === 'up'} onClick={() => onVote(comment.event, 'up')} />
            <span className={`min-w-[1.5rem] text-center text-body-sm font-semibold ${comment.votes > 0 ? 'text-accent' : 'text-fg'}`}>{comment.votes}</span>
            <VoteButton direction="down" active={myVote === 'down'} onClick={() => onVote(comment.event, 'down')} />
          </div>
          <button type="button" className={BTN_GHOST} onClick={() => setShowReply((v) => !v)}>
            <CommentIcon size={12} />
            Reply
          </button>
        </div>

        {showReply && (
          <div className="mt-3">
            <ReplyComposer
              placeholder="Write a reply…"
              onCancel={() => setShowReply(false)}
              onSubmit={(text) => { void onReply(comment.event, text); setShowReply(false); return Promise.resolve(); }}
              disabled={false}
            />
          </div>
        )}

        {hasReplies && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((r) => (
              <CommentRow
                key={r.event.id}
                comment={r}
                meta={meta}
                myVoteByTarget={myVoteByTarget}
                onVote={onVote}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
