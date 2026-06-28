import { useCallback, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '~/lib/ui/motion';
import { voteReorderDelayMs } from './voteAnimation';

const MOVE_THRESHOLD = 1; // px — below this, no animation
const REORDER_DURATION = 0.65;

/**
 * A captured "before" state for a pending FLIP animation. Both trigger paths
 * produce one of these and hand it to the layout effect, which is the single
 * consumer — no parallel refs to reconcile.
 *
 * - `click`: a local vote. `heroId` is the row the user voted on; the play step
 *   waits for that row's arrow animation before animating and gives it a
 *   scale-pop. `tops` was captured synchronously in the click handler.
 * - `external`: a remote reorder (subscription). No hero, no arrow wait — the
 *   play step runs immediately. `tops` was captured in the render phase.
 */
type PendingTrigger =
  | { kind: 'click'; heroId: string; direction: 'up' | 'down'; clickedAt: number; tops: Map<string, number>; scrollY: number }
  | { kind: 'external'; tops: Map<string, number>; scrollY: number }
  | null;

/**
 * useFlipReorder — FLIP animation for hot-sort list re-ordering after a vote.
 * Returns a ref-callback binder for each row and a `markHero` callback to
 * flag the row the user just voted on.
 *
 * Two trigger paths feed one `pendingTriggerRef`:
 *
 * 1. **Click (local client):** `markHero` captures each row's layout position
 *    synchronously in the click handler and records a `click` trigger. When
 *    `targetIds` changes (relay delivered the vote and React re-rendered),
 *    every displaced row animates via transform. The Play step waits until the
 *    vote-button arrow animation finishes; the voted row gets a scale-pop.
 *
 * 2. **External (remote client / subscription):** When `targetIds` changes
 *    without a prior `markHero` call, a render-phase snapshot captures row
 *    positions before DOM commit (the component function runs before React
 *    commits the new layout) and records an `external` trigger. The FLIP
 *    effect animates all displaced rows immediately (no arrow delay, no hero).
 *
 * `targetIds` must be a stable array (memoized by the caller).
 */
export function useFlipReorder(targetIds: string[]) {
  const rowRefsRef = useRef<Map<string, HTMLElement> | null>(null);
  if (rowRefsRef.current === null) rowRefsRef.current = new Map();
  const rowRefs = rowRefsRef.current;

  // Single pending-trigger owner for both paths. `markHero` writes a `click`;
  // the render-phase snapshot writes an `external`. The layout effect is the
  // sole reader and clears it after consuming.
  const pendingTriggerRef = useRef<PendingTrigger>(null);

  const refCallbacksRef = useRef<Map<string, (el: HTMLElement | null) => void> | null>(null);
  if (refCallbacksRef.current === null) refCallbacksRef.current = new Map();
  const refCallbacks = refCallbacksRef.current;

  const captureTops = useCallback((): Map<string, number> => {
    const tops = new Map<string, number>();
    for (const [id, el] of rowRefs) tops.set(id, el.offsetTop);
    return tops;
  }, [rowRefs]);

  const bindRowRef = useCallback((id: string) => {
    let cb = refCallbacks.get(id);
    if (cb === undefined) {
      cb = (el: HTMLElement | null) => {
        if (el) rowRefs.set(id, el);
        else rowRefs.delete(id);
      };
      refCallbacks.set(id, cb);
    }
    return cb;
  }, [rowRefs, refCallbacks]);

  const markHero = useCallback((id: string, direction: 'up' | 'down') => {
    pendingTriggerRef.current = {
      kind: 'click',
      heroId: id,
      direction,
      clickedAt: performance.now(),
      tops: captureTops(),
      scrollY: window.scrollY,
    };
  }, [captureTops]);

  // Render-phase snapshot: when targetIds changes without a click, capture row
  // positions before React commits the new DOM. This runs during the component
  // function (render phase), so elements are still at their old layout
  // positions — same timing as the click handler above.
  const prevTargetIdsRef = useRef(targetIds);
  if (prevTargetIdsRef.current !== targetIds && pendingTriggerRef.current === null && rowRefs.size > 0) {
    pendingTriggerRef.current = {
      kind: 'external',
      tops: captureTops(),
      scrollY: window.scrollY,
    };
  }
  prevTargetIdsRef.current = targetIds;

  useLayoutEffect(() => {
    const trigger = pendingTriggerRef.current;
    pendingTriggerRef.current = null;
    if (trigger === null) return;

    const isClick = trigger.kind === 'click';
    const heroId = isClick ? trigger.heroId : null;
    const heroEl = heroId ? (rowRefs.get(heroId) ?? null) : null;

    const moved: { el: HTMLElement; dy: number; isHero: boolean }[] = [];
    for (const [rowId, el] of rowRefs) {
      const prevTop = trigger.tops.get(rowId);
      if (prevTop === undefined) continue;
      const dy = prevTop - el.offsetTop;
      if (Math.abs(dy) >= MOVE_THRESHOLD) {
        moved.push({ el, dy, isHero: heroEl !== null && el === heroEl });
      }
    }
    if (moved.length === 0) return;

    if (prefersReducedMotion()) return;

    // Click path waits for the arrow animation to finish; external path
    // plays immediately since there is no arrow animation on the observer.
    const delaySec =
      isClick && heroEl
        ? voteReorderDelayMs(trigger.direction, trigger.clickedAt) / 1000
        : 0;
    const lockedScrollY = trigger.scrollY;

    const restoreScroll = () => {
      if (window.scrollY !== lockedScrollY) window.scrollTo(0, lockedScrollY);
    };

    // DOM reorder moves rows in layout; scroll anchoring tries to follow them
    // — especially when a row was near the viewport bottom.
    restoreScroll();

    const ctx = gsap.context(() => {
      // Invert immediately so the reordered DOM still looks like the old layout
      // until the Play phase. Delaying the whole FLIP left rows at their new
      // positions during the wait — the visible jump.
      for (const { el, dy, isHero } of moved) {
        gsap.set(el, {
          y: dy,
          zIndex: isHero ? 20 : 1,
          willChange: 'transform',
          transformOrigin: 'center center',
        });
      }

      restoreScroll();

      const run = () => {
        restoreScroll();
        const tl = gsap.timeline({
          defaults: { overwrite: 'auto' },
          onComplete: () => {
            gsap.set(moved.map(({ el }) => el), { clearProps: 'transform,zIndex,willChange' });
            restoreScroll();
          },
        });

        for (const { el } of moved) {
          tl.to(el, { y: 0, duration: REORDER_DURATION, ease: 'power2.inOut' }, 0);
        }

        if (heroEl) {
          tl.fromTo(
            heroEl,
            { scale: 1.04 },
            { scale: 1, duration: 0.25, ease: 'power3.out' },
            REORDER_DURATION,
          );
        }
      };

      if (delaySec > 0) gsap.delayedCall(delaySec, run);
      else run();
    });

    return () => {
      ctx.revert();
    };
  }, [targetIds, rowRefs]);

  return { bindRowRef, markHero };
}
