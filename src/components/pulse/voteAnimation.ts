/** Total duration of the VoteButton launch timeline per direction (seconds). */
export const VOTE_LAUNCH_DURATION: Record<'up' | 'down', number> = {
  up: 0.16 + 0.24 + 0.12,
  down: 0.72 + 0.22,
};

/** Milliseconds to wait after vote click before starting row reorder animation. */
export function voteReorderDelayMs(
  direction: 'up' | 'down',
  clickedAtMs: number,
  nowMs = performance.now(),
): number {
  return Math.max(0, VOTE_LAUNCH_DURATION[direction] * 1000 - (nowMs - clickedAtMs));
}
