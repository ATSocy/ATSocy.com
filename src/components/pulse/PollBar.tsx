import type { PollOptionBreakdown } from '~/lib/nostr/events';

// Poll bar colors (exact hex). Single owner of the palette; imported by
// PollCard, PollInline, and the legend so they can never drift apart.
export const COLOR_GUEST = '#f9c6f9';
export const COLOR_ALIEN = '#d8d9dc';

export interface PollBarProps {
  /** Option breakdown — from `pollOptionBreakdown()`. */
  breakdown: PollOptionBreakdown;
  /**
   * Full: absolute-inset fills over a sized parent (PollCard detail rows).
   * Inline: self-sized bar for compact rows (PollInline).
   */
  variant: 'full' | 'inline';
}

/**
 * PollBar — the alien/guest stacked vote bar. The alien (gray) layer fills to
 * the option's total `percentage`; the guest (pink) layer overlays from the
 * left to its `guestPct` share. One implementation shared by the detail card
 * and the inline preview so the two views can't drift.
 *
 * Renders nothing when the option has no votes.
 */
export function PollBar({ breakdown, variant }: PollBarProps) {
  // The alien (gray) layer fills to `percentage`; the guest (pink) overlay
  // covers its `guestPct` share from the left. `alienPct` is implied
  // (percentage − guestPct) and not needed to render the widths.
  const { count, percentage, guestPct } = breakdown;
  if (count <= 0) return null;

  if (variant === 'inline') {
    return (
      <div className="relative h-2 min-w-0 flex-1 max-w-[200px] overflow-hidden rounded-[4px] corner-squircle">
        <span
          className="absolute inset-y-0 left-0 rounded-[4px] corner-squircle transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: COLOR_ALIEN }}
        />
        {guestPct > 0 && (
          <span
            className="absolute inset-y-0 left-0 rounded-[4px] corner-squircle transition-[width] duration-500 ease-out"
            style={{ width: `${guestPct}%`, backgroundColor: COLOR_GUEST }}
          />
        )}
      </div>
    );
  }

  return (
    <span className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[14px]" aria-hidden="true">
      <span
        className="absolute inset-y-0 left-0 rounded-[4px] corner-squircle transition-[width] duration-500 ease-out"
        style={{ width: `${percentage}%`, backgroundColor: COLOR_ALIEN }}
      />
      {guestPct > 0 && (
        <span
          className="absolute inset-y-0 left-0 rounded-[4px] corner-squircle transition-[width] duration-500 ease-out"
          style={{ width: `${guestPct}%`, backgroundColor: COLOR_GUEST }}
        />
      )}
    </span>
  );
}
