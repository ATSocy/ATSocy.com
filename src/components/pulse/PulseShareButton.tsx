import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { gsap } from 'gsap';
import ShareLineDuotone from '@iconify-react/solar/share-line-duotone';
import { NostrIcon } from '~/components/icons/NostrIcon';

function ShareIcon() {
  return <ShareLineDuotone width="16" height="16" />;
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.46 13.54a3.25 3.25 0 0 0 4.6 0l2.12-2.12a3.25 3.25 0 0 0-4.6-4.6l-.53.53" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
      <path d="M13.54 10.46a3.25 3.25 0 0 0-4.6 0l-2.12 2.12a3.25 3.25 0 0 0 4.6 4.6l.53-.53" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="text-accent" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d="M9.53 3.22a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 1.06-1.06l.97.97l3.97-3.97a.75.75 0 0 1 1.06 0" clipRule="evenodd"></path>
    </svg>
  );
}

export interface PulseShareButtonProps {
  url: string;
  nostrValue: string;
  triggerClassName?: string;
  actionClassName?: string;
  onTriggerClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onActionClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function PulseShareButton({
  url,
  nostrValue,
  triggerClassName = '',
  actionClassName = '',
  onTriggerClick,
  onActionClick,
}: PulseShareButtonProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);
  const hideTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [copiedAction, setCopiedAction] = useState<'nostr' | 'link' | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) hide();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') hide();
    }

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function setOptionRef(index: number, node: HTMLButtonElement | null) {
    if (!node) return;
    optionsRef.current[index] = node;
  }

  function show() {
    const panel = panelRef.current;
    const options = optionsRef.current.filter(Boolean);
    if (!panel || options.length === 0) return;

    setCopiedAction(null);
    panel.hidden = false;
    panel.classList.remove('pointer-events-none');
    setOpen(true);

    gsap.fromTo(
      options,
      { opacity: 0, x: -10, scale: 0.7, rotate: -12 },
      { opacity: 1, x: 0, scale: 1, rotate: 0, duration: 0.35, stagger: 0.06, ease: 'back.out(1.8)' },
    );
    gsap.to(panel, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  }

  function hide() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const panel = panelRef.current;
    const options = optionsRef.current.filter(Boolean);
    if (!panel || options.length === 0) {
      setOpen(false);
      return;
    }

    setOpen(false);
    gsap.to(options, {
      opacity: 0,
      x: -8,
      scale: 0.8,
      duration: 0.18,
      stagger: 0.03,
      ease: 'power2.in',
      onComplete: () => {
        setCopiedAction(null);
        panel.hidden = true;
        panel.classList.add('pointer-events-none');
      },
    });
    gsap.to(panel, { opacity: 0, duration: 0.18, ease: 'power2.in' });
  }

  async function copy(action: 'nostr' | 'link', button: HTMLButtonElement) {
    const value = action === 'nostr' ? nostrValue : url;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard may be unavailable.
    }

    setCopiedAction(action);
    gsap.set(button, { scale: 0 });
    gsap.to(button, { scale: 1, duration: 0.25, ease: 'back.out(2)' });

    for (const option of optionsRef.current) {
      if (option && option !== button) gsap.to(option, { opacity: 0.3, duration: 0.2 });
    }

    hideTimerRef.current = window.setTimeout(() => {
      hide();
    }, 2000);
  }

  return (
    <div ref={rootRef} className="relative pointer-events-auto inline-flex items-center">
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-label="Share post"
        onClick={(event) => {
          onTriggerClick?.(event);
          if (open) hide();
          else show();
        }}
      >
        <ShareIcon />
      </button>

      <div
        ref={panelRef}
        hidden
        className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 flex -translate-y-1/2 items-center gap-2 opacity-0"
      >
        <button
          ref={(node) => setOptionRef(0, node)}
          type="button"
          className={actionClassName}
          aria-label="Copy Nostr share"
          onClick={(event) => {
            onActionClick?.(event);
            void copy('nostr', event.currentTarget);
          }}
        >
          {copiedAction === 'nostr' ? <CheckIcon /> : <NostrIcon className="h-4 w-4" />}
        </button>
        <button
          ref={(node) => setOptionRef(1, node)}
          type="button"
          className={actionClassName}
          aria-label="Copy post link"
          onClick={(event) => {
            onActionClick?.(event);
            void copy('link', event.currentTarget);
          }}
        >
          {copiedAction === 'link' ? <CheckIcon /> : <LinkIcon />}
        </button>
      </div>
    </div>
  );
}
