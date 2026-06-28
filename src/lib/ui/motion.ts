/**
 * Motion helpers — single source of truth for the user's reduced-motion
 * preference and the policy every animation site should honor.
 *
 * Checking `matchMedia` per call (rather than once at module load) keeps the
 * result live: a user toggling the OS setting will be respected on the next
 * animation without a reload.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** True when the user has requested reduced motion at the OS/browser level. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
