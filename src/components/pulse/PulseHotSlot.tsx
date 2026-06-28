import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '~/lib/ui/motion';
import { PulseRow } from './PulseRow';
import type { PostNode } from '~/lib/nostr/events';
import type { NostrEvent } from '@nostrify/types';

/**
 * The entry a PulseHotSlot renders — a `PulseRow`'s props bundled into one
 * object so the crossfade can hold a "previous" and "next" entry side by side.
 */
export interface PulseHotEntry {
  post: PostNode;
  myVote: 'up' | 'down' | null;
  pollResponses: NostrEvent[];
}

interface PulseHotSlotProps {
  entry: PulseHotEntry;
  meta: NostrEvent[];
}

/**
 * PulseHotSlot — the animated "post of the day" surface for `limit === 1`.
 *
 * Crossfades between entries when the top post changes. The animation is keyed
 * off the post id only, so the midpoint `setVisible(next)` (which swaps in the
 * new row for the fade-in half) does not itself re-trigger the effect and kill
 * the fade-in. An `entryRef` always points at the latest entry, so if a new
 * top post arrives mid-swap it is simply picked up on the next transition — no
 * queue or re-render escape hatch is needed.
 */
export function PulseHotSlot({ entry, meta }: PulseHotSlotProps) {
  const shellRef = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState(entry);
  const entryRef = useRef(entry);
  const hasMountedRef = useRef(false);
  entryRef.current = entry;

  // Refresh derived fields (votes / responses) in place without a crossfade.
  useEffect(() => {
    setVisible((current) => (current.post.event.id === entry.post.event.id ? entry : current));
  }, [entry]);

  // Crossfade only when the post id changes.
  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setVisible(entryRef.current);
      return;
    }

    if (prefersReducedMotion()) {
      setVisible(entryRef.current);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.killTweensOf(shell);
      gsap.set(shell, {
        transformOrigin: 'center center',
        willChange: 'transform,opacity',
        overflow: 'hidden',
      });

      gsap.to(shell, {
        autoAlpha: 0,
        y: -18,
        duration: 0.2,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          // Swap to the freshest entry available, then fade in.
          setVisible(entryRef.current);

          requestAnimationFrame(() => {
            const liveShell = shellRef.current;
            if (!liveShell) return;

            gsap.fromTo(
              liveShell,
              { autoAlpha: 0, y: 18, transformOrigin: 'center center', willChange: 'transform,opacity', overflow: 'hidden' },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.24,
                ease: 'power2.out',
                overwrite: 'auto',
                onComplete: () => {
                  gsap.set(liveShell, { clearProps: 'transform,opacity,visibility,overflow,willChange' });
                },
              },
            );
          });
        },
      });
    }, shell);

    return () => ctx.revert();
  }, [entry.post.event.id]);

  return (
    <ul ref={shellRef} className="space-y-1">
      <PulseRow
        key={visible.post.event.id}
        post={visible.post}
        meta={meta}
        myVote={visible.myVote}
        pollResponses={visible.pollResponses}
      />
    </ul>
  );
}
