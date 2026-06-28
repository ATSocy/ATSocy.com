import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { usePublish } from '~/lib/nostr/usePublish';
import { type PublishTemplate } from '~/lib/nostr/events';
import { useLoginActions } from '~/lib/identity/useLoginActions';
import { useNip07ExtensionState } from '~/lib/identity/useNip07Extension';
import { queueFlashToast } from '~/lib/ui/flash-toast';
import { cachePulsePost } from '~/lib/pulse/post-cache';
import { LoginWithNostrButton } from '~/components/identity/LoginWithNostrButton';
import { BouncingDotsLoader } from '~/components/ui/BouncingDotsLoader';
import { DisplayNameEditor } from '~/components/identity/DisplayNameEditor';
import { EditNameIcon } from '~/components/identity/EditNameIcon';
import { useProfileName } from '~/lib/identity/useProfileName';
import { NOSTR_RELAYS } from '~/config/feeds';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { useNostrLogin } from '@nostrify/react/login';
import { nip19 } from 'nostr-tools';
import { AlienAvatar } from '@zenon-red/alien-avatars-react';
import { useMemo, useState, type ReactNode } from 'react';
import { imetaTag, imetaPartsWithAlt, urlFromImetaParts } from '~/lib/blossom/tags';
import { pulsePostHref } from '~/lib/pulse/routes';
import { MediaUploadField, type UploadedMedia } from '~/components/pulse/MediaUploadField';
import { XnnDateTimePicker } from '~/components/ui/XnnDateTimePicker';
import { XnnTabs, XnnTabsList, XnnTabsPanel, XnnTabsTab } from '~/components/ui/XnnTabs';
import { eventContent, normalizeExternalUrl, defaultEndsAt, makeOption, type PollOption } from './post-forms';

const CONTROL = 'w-full rounded-[18px] border border-line bg-canvas px-4 py-3 text-body-sm text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-accent';
const PANEL = 'rounded-[24px] border border-line bg-surface px-5 py-5 shadow-panel sm:px-6 sm:py-6';
const BTN_SOLID = 'inline-flex items-center justify-center rounded-[18px] corner-squircle bg-accent px-4 py-2.5 text-body-sm font-medium text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50';
const BTN_GHOST = 'inline-flex items-center justify-center rounded-[18px] corner-squircle px-4 py-2.5 text-body-sm font-medium text-fg-muted transition-colors hover:bg-raised hover:text-fg no-underline';
const LABEL_CLASS = 'block text-body-sm font-medium text-fg';

type PostType = 'text' | 'media' | 'link' | 'poll';

const POST_TABS: [PostType, string][] = [
  ['text', 'Text'],
  ['media', 'Media'],
  ['link', 'Link'],
  ['poll', 'Poll'],
];

export function PulseCreatePostPage() {
  return (
    <NostrIsland>
      <PulseCreatePostPageInner />
    </NostrIsland>
  );
}

function PulseCreatePostPageInner() {
  const user = useCurrentUser();
  const [tab, setTab] = useState<PostType>('text');

  return (
    <div className="xnn-panel min-h-[42rem] border-y-0 px-5 py-6 sm:px-6 lg:px-8 lg:py-8" data-nosnippet>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="xnn-heading-lg">Create post</h1>
          <p className="mt-2 max-w-2xl text-body-sm text-fg-muted">
            Publish a text, media, link, or poll post to Pulse.
          </p>
        </div>

        <XnnTabs value={tab} onValueChange={(value) => setTab(value as PostType)}>
          <XnnTabsList aria-label="Post type">
            {POST_TABS.map(([value, label]) => (
              <XnnTabsTab key={value} value={value}>
                {label}
              </XnnTabsTab>
            ))}
          </XnnTabsList>

          <XnnTabsPanel value="text">
            <TextPostForm user={user} />
          </XnnTabsPanel>
          <XnnTabsPanel value="media">
            <MediaPostForm user={user} />
          </XnnTabsPanel>
          <XnnTabsPanel value="link">
            <LinkPostForm user={user} />
          </XnnTabsPanel>
          <XnnTabsPanel value="poll">
            <PollPostForm user={user} />
          </XnnTabsPanel>
        </XnnTabs>
      </div>
    </div>
  );
}

// Shared form shell

interface FormProps {
  user: ReturnType<typeof useCurrentUser>;
}

function PostingAs({ user }: FormProps) {
  const { logins } = useNostrLogin();
  const actions = useLoginActions();
  const { available: hasExtension } = useNip07ExtensionState();
  const isGuest = logins[0]?.type === 'nsec';
  const npub = useMemo(() => (user ? nip19.npubEncode(user.pubkey) : ''), [user]);
  const { name: profileName, content: profileContent } = useProfileName(user);
  const label = profileName ?? (npub ? shortTail(npub) : null);

  const [editingName, setEditingName] = useState(false);

  if (editingName) {
    return (
      <div className="mb-4">
        <DisplayNameEditor
          currentName={profileName}
          content={profileContent}
          onSaved={() => setEditingName(false)}
          onCancel={() => setEditingName(false)}
        />
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-row justify-between items-center gap-2">
      <span className="inline-flex items-center gap-2 min-h-6 xnn-meta text-fg-muted">
        {user ? (
          <>
            <span>Posting as</span>
            <AlienAvatar seed={npub || user.pubkey} size={18} className="rounded-full" />
            <span>{label}</span>
            {user && isGuest && (
              <button
                type="button"
                aria-label="Edit name"
                onClick={() => setEditingName(true)}
                className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-fg-muted transition-colors hover:text-fg cursor-pointer"
              >
                <EditNameIcon />
              </button>
            )}
          </>
        ) : (
          <span>Generating identity…</span>
        )}
      </span>
      {user && isGuest && hasExtension && (
        <LoginWithNostrButton onClick={() => void actions.loginExtension()} />
      )}
    </div>
  );
}

function shortTail(npub: string): string {
  return `…${npub.slice(-6)}`;
}

type BuildResult = { template: PublishTemplate } | { error: string };

type PublishState =
  | { status: 'idle' }
  | { status: 'publishing' }
  | { status: 'redirecting' };

/**
 * FormShell — header (PostingAs), panel wrapper, and action bar (Publish +
 * Back-to-Pulse + status). The form lives inside as `children`; the publish
 * button calls `build()` to validate+compose, publishes, and replaces itself
 * with the bouncing-dots loader during publish, then redirects immediately on
 * success while a flash toast is queued for the destination page.
 */
function FormShell({
  user,
  disabled,
  build,
  onReset,
  hint,
  children,
}: {
  user: FormProps['user'];
  disabled: boolean;
  build: () => BuildResult | Promise<BuildResult>;
  onReset: () => void;
  hint?: string;
  children: ReactNode;
}) {
  const publish = usePublish();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PublishState>({ status: 'idle' });

  async function submit() {
    setError(null);
    setState({ status: 'publishing' });
    try {
      const result = await Promise.resolve(build());
      if ('error' in result) {
        setError(result.error);
        setState({ status: 'idle' });
        return;
      }
      const event = await publish(result.template);
      onReset();
      cachePulsePost(event);
      const kindLabel = event.kind === 1068 ? 'Poll' : 'Post';
      queueFlashToast({
        title: `${kindLabel} published`,
        description: 'Opening your post now.',
      });
      setState({ status: 'redirecting' });
      window.location.assign(pulsePostHref(event.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish post.');
      setState({ status: 'idle' });
    }
  }

  const busy = state.status === 'publishing' || state.status === 'redirecting';
  const canSubmit = !disabled && !busy;

  if (busy) {
    return (
      <div className="flex min-h-[42rem] flex-col items-center justify-center gap-6 py-16">
        <BouncingDotsLoader />
      </div>
    );
  }

  return (
    <div className="min-h-[42rem] space-y-4">
      <div className={PANEL}>
        <PostingAs user={user} />
        {children}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {error && <p className="text-body-sm text-[var(--color-red-600)]">{error}</p>}
          {hint && <p className="xnn-meta text-fg-muted">{hint}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/#pulse" className={BTN_GHOST}>Back to Pulse</a>
          <button type="button" className={BTN_SOLID} disabled={!canSubmit} onClick={() => void submit()}>
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
}

function TitleField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <label htmlFor={id} className={LABEL_CLASS}>Title<span className="text-accent">*</span></label>
        <span className="text-body-sm text-accent">{value.length}/300</span>
      </div>
      <input id={id} className={CONTROL} maxLength={300} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Title" />
    </div>
  );
}

// Per-type forms

function TextPostForm({ user }: FormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function build(): BuildResult {
    const trimmed = title.trim();
    if (!trimmed) return { error: 'Title is required.' };
    return {
      template: {
        kind: 1,
        content: eventContent(trimmed, body),
        tags: [['title', trimmed]],
      },
    };
  }

  return (
    <FormShell
      user={user}
      disabled={!user}
      build={build}
      onReset={() => { setTitle(''); setBody(''); }}
    >
      <div className="space-y-4">
        <TitleField id="text-title" value={title} onChange={setTitle} />
        <div>
          <label htmlFor="text-body" className={LABEL_CLASS}>Body text</label>
          <textarea id="text-body" rows={8} className={`${CONTROL} min-h-40 resize-y`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body text (optional)" />
        </div>
      </div>
    </FormShell>
  );
}

function mediaPostContent(title: string, mediaUrl: string | null): string {
  if (mediaUrl) return `${title}\n\n${mediaUrl}`;
  return title;
}

function MediaPostForm({ user }: FormProps) {
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [media, setMedia] = useState<UploadedMedia | null>(null);

  function build(): BuildResult {
    const trimmed = title.trim();
    if (!trimmed) return { error: 'Title is required.' };
    if (!media) return { error: 'Upload an image or video.' };
    if (media.status === 'uploading') return { error: 'Wait for the upload to finish.' };
    if (media.status === 'error') return { error: 'Remove the failed upload or try again.' };
    if (!media.imetaParts) return { error: 'Upload an image or video.' };
    const mediaUrl = urlFromImetaParts(media.imetaParts);
    const imetaParts = imetaPartsWithAlt(media.imetaParts, altText);
    return {
      template: {
        kind: 1,
        content: mediaPostContent(trimmed, mediaUrl),
        tags: [
          ['title', trimmed],
          imetaTag(imetaParts),
        ],
      },
    };
  }

  return (
    <FormShell
      user={user}
      disabled={!user}
      build={build}
      onReset={() => {
        setTitle('');
        setAltText('');
        if (media) URL.revokeObjectURL(media.previewUrl);
        setMedia(null);
      }}
    >
      <div className="space-y-4">
        <TitleField id="media-title" value={title} onChange={setTitle} />
        <MediaUploadField item={media} onChange={setMedia} disabled={!user} />
        <div>
          <label htmlFor="media-alt" className={LABEL_CLASS}>Alt text</label>
          <textarea
            id="media-alt"
            rows={3}
            className={`${CONTROL} min-h-16 resize-y`}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for accessibility (optional)"
          />
        </div>
      </div>
    </FormShell>
  );
}

function LinkPostForm({ user }: FormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');

  function build(): BuildResult {
    const trimmed = title.trim();
    if (!trimmed) return { error: 'Title is required.' };
    const trimmedUrl = normalizeExternalUrl(url);
    if (!trimmedUrl) return { error: 'Link URL is required.' };
    return {
      template: {
        kind: 1,
        content: [trimmed, trimmedUrl, body.trim()].filter(Boolean).join('\n\n'),
        tags: [
          ['title', trimmed],
          ['r', trimmedUrl],
        ],
      },
    };
  }

  return (
    <FormShell
      user={user}
      disabled={!user}
      build={build}
      onReset={() => { setTitle(''); setUrl(''); setBody(''); }}
    >
      <div className="space-y-4">
        <TitleField id="link-title" value={title} onChange={setTitle} />
        <div>
          <label htmlFor="link-url" className={LABEL_CLASS}>Link URL<span className="text-accent">*</span></label>
          <input id="link-url" className={CONTROL} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label htmlFor="link-body" className={LABEL_CLASS}>Body text</label>
          <textarea id="link-body" rows={6} className={`${CONTROL} min-h-28 resize-y`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Why this link matters (optional)" />
        </div>
      </div>
    </FormShell>
  );
}

function PollPostForm({ user }: FormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [options, setOptions] = useState<PollOption[]>([makeOption(), makeOption()]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [endsAt, setEndsAt] = useState(defaultEndsAt);

  function build(): BuildResult {
    const trimmed = title.trim();
    if (!trimmed) return { error: 'Question is required.' };
    const optionTexts = options.flatMap((o) => {
      const t = o.text.trim();
      return t ? [t] : [];
    });
    if (optionTexts.length < 2) return { error: 'Add at least two poll options.' };
    const endsAtSeconds = Math.floor(new Date(endsAt).getTime() / 1000);
    if (!Number.isFinite(endsAtSeconds)) return { error: 'Choose a valid end time.' };
    return {
      template: {
        kind: 1068,
        content: eventContent(trimmed, body),
        tags: [
          ...options.flatMap((o, i) => o.text.trim() ? [['option', String(i + 1), o.text.trim()]] : []),
          ...NOSTR_RELAYS.map((r) => ['relay', r]),
          ['polltype', multipleChoice ? 'multiplechoice' : 'singlechoice'],
          ['endsAt', String(endsAtSeconds)],
          ['title', trimmed],
        ],
      },
    };
  }

  return (
    <FormShell
      user={user}
      disabled={!user}
      build={build}
      onReset={() => {
        setTitle('');
        setBody('');
        setOptions([makeOption(), makeOption()]);
        setMultipleChoice(false);
        setEndsAt(defaultEndsAt());
      }}
    >
      <div className="space-y-3">
        <TitleField id="poll-title" value={title} onChange={setTitle} />
        <div>
          <label htmlFor="poll-body" className={LABEL_CLASS}>Body text</label>
          <textarea id="poll-body" rows={5} className={`${CONTROL} min-h-24 resize-y`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body text (optional)" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-body-sm font-medium text-fg">Options</p>
            <button type="button" className={BTN_GHOST} onClick={() => setOptions((o) => [...o, makeOption()])}>
              Add option
            </button>
          </div>
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3">
              <label htmlFor={`poll-option-${option.id}`} className="sr-only">Option {index + 1}</label>
              <input
                id={`poll-option-${option.id}`}
                aria-label={`Option ${index + 1}`}
                className={CONTROL}
                value={option.text}
                onChange={(e) => setOptions((opts) => opts.map((o) => o.id === option.id ? { ...o, text: e.target.value } : o))}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button type="button" className={BTN_GHOST} onClick={() => setOptions((opts) => opts.filter((o) => o.id !== option.id))}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="poll-ends-at" className={LABEL_CLASS}>Ends at<span className="text-accent">*</span></label>
          <XnnDateTimePicker
            id="poll-ends-at"
            value={endsAt}
            onChange={setEndsAt}
            disabled={!user}
          />
        </div>
        <label htmlFor="poll-multiple" className="inline-flex items-center gap-3 text-body-sm text-fg">
          <input id="poll-multiple" type="checkbox" checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} className="h-5 w-5 rounded-sm border border-line bg-canvas accent-[var(--color-accent)]" />
          Allow multiple choices
        </label>
      </div>
    </FormShell>
  );
}
