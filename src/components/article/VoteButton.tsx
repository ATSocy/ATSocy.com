import { useEffect, useRef, useState } from 'react';
import MapArrowUpBold from '@iconify-react/solar/map-arrow-up-bold';
import MapArrowUpOutline from '@iconify-react/solar/map-arrow-up-outline';
import { gsap } from 'gsap';

/**
 * VoteButton — animated up/down arrow with GSAP launch + clear timelines.
 * Shared between Pulse feed rows and Pulse post detail comments.
 *
 * Visual `active` state is deferred until the launch/clear timeline finishes
 * so a parent optimistic update does not swap the icon mid-animation.
 */
export interface VoteButtonProps {
  direction: 'up' | 'down';
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function VoteButton({ direction, active, onClick, className }: VoteButtonProps) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const launchTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const clearTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const animatingRef = useRef(false);
  const [displayActive, setDisplayActive] = useState(active);

  useEffect(() => {
    if (!animatingRef.current) setDisplayActive(active);
  }, [active]);

  useEffect(() => {
    const icon = iconRef.current;
    if (!icon) return;

    gsap.set(icon, { y: 0, opacity: 1, scale: 1, transformOrigin: 'center center' });

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        animatingRef.current = false;
        setDisplayActive(true);
      },
    });
    if (direction === 'up') {
      timeline
        .to(icon, { y: 4, duration: 0.16, ease: 'power1.inOut' })
        .to(icon, { y: -24, duration: 0.24, ease: 'power2.out' })
        .set(icon, { y: 18, opacity: 0 })
        .to(icon, { y: 0, opacity: 1, duration: 0.12, ease: 'power1.out' });
    } else {
      timeline
        .to(icon, { y: 24, duration: 0.72, ease: 'power1.inOut' })
        .set(icon, { y: -12, opacity: 0, scale: 0.82 })
        .to(icon, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' });
    }

    const clearTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        animatingRef.current = false;
        setDisplayActive(false);
      },
    });
    clearTimeline
      .to(icon, { scale: 1.16, duration: 0.12, ease: 'power1.out' })
      .to(icon, { scale: 0.9, duration: 0.12, ease: 'power1.inOut' })
      .to(icon, { scale: 1, duration: 0.14, ease: 'power2.out' });

    launchTimelineRef.current = timeline;
    clearTimelineRef.current = clearTimeline;

    return () => {
      timeline.kill();
      clearTimeline.kill();
    };
  }, [direction]);

  const Icon = displayActive ? MapArrowUpBold : MapArrowUpOutline;

  return (
    <button
      type="button"
      className={`${displayActive ? 'text-accent' : 'hover:text-fg'}${className ? ` ${className}` : ''}`}
      aria-label={direction === 'up' ? 'Upvote' : 'Downvote'}
      aria-pressed={displayActive}
      onClick={(e) => {
        onClick(e);
        animatingRef.current = true;
        try {
          if (displayActive) {
            clearTimelineRef.current?.restart();
          } else {
            launchTimelineRef.current?.restart();
          }
        } catch {
          // GSAP timeline killed during unmount — safe to ignore.
          animatingRef.current = false;
        }
      }}
    >
      <span className="block h-[18px] overflow-hidden">
        <span ref={iconRef} className={`block ${direction === 'down' ? 'rotate-180' : ''}`}>
          <Icon width="18" height="18" />
        </span>
      </span>
    </button>
  );
}

/** Comment bubble icon — shared between Pulse feed and Pulse post detail. */
export function CommentIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d="M12 2.75A9.25 9.25 0 0 0 2.75 12c0 1.481.348 2.879.965 4.118c.248.498.343 1.092.187 1.677l-.596 2.225a.55.55 0 0 0 .673.674l2.227-.596a2.38 2.38 0 0 1 1.676.187A9.2 9.2 0 0 0 12 21.25a9.25 9.25 0 0 0 0-18.5M1.25 12C1.25 6.063 6.063 1.25 12 1.25S22.75 6.063 22.75 12S17.937 22.75 12 22.75c-1.718 0-3.344-.404-4.787-1.122a.9.9 0 0 0-.62-.08l-2.226.595c-1.524.408-2.918-.986-2.51-2.51l.596-2.226a.9.9 0 0 0-.08-.62A10.7 10.7 0 0 1 1.25 12m6-1.5A.75.75 0 0 1 8 9.75h8a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 3.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75" clipRule="evenodd"></path>
    </svg>
  );
}
