import { useEffect, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { cx } from '~/lib/ui/cx';
import {
  parsePollData,
  formatRemainingTime,
  countPollResponses,
  countPollResponsesByClient,
  myPollVotes,
  pollOptionBreakdown,
  type PollClientCounts,
} from '~/lib/nostr/events';
import type { NostrEvent } from '@nostrify/types';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { InfoIcon } from '~/components/ui/InfoIcon';
import { PollBar, COLOR_GUEST, COLOR_ALIEN } from '~/components/pulse/PollBar';

// PollBadge

export function PollBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-[12px] corner-squircle bg-accent/10 px-2 py-0.5 text-caption font-medium text-accent',
        className,
      )}
    >
      <PollIcon size={10} />
      <span>Poll</span>
    </span>
  );
}

export function PollRemainingTime({ endsAt }: { endsAt: number | null }) {
  const [remaining, setRemaining] = useState(() => formatRemainingTime(endsAt));
  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      setRemaining(formatRemainingTime(endsAt));
    }, 60_000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!remaining) return null;
  return (
    <span className="inline-flex items-center gap-1 text-caption font-medium text-accent">
      <TimerIcon size={10} />
      <span>{remaining}</span>
    </span>
  );
}

// PollCard — full poll display (detail page)

export interface PollCardProps {
  event: NostrEvent;
  /** Kind 1018 response events for this poll. Empty when not yet loaded. */
  responses: NostrEvent[];
  disabled?: boolean;
  onVote?: (optionId: string) => void;
}

/**
 * PollCard — renders the full poll UI: question, options as radio buttons
 * (single-choice) with vote counts, or a results view after voting / poll ended.
 *
 * Uses Base UI RadioGroup for accessible selection, styled with xnn tokens.
 */
export function PollCard({ event, responses, disabled, onVote }: PollCardProps) {
  const pollData = parsePollData(event);
  const user = useCurrentUser();
  const myVotes = user ? myPollVotes(responses, event.id, user.pubkey) : [];
  const counts = countPollResponses(responses, event.id);
  const clientCounts = countPollResponsesByClient(responses, event.id);

  if (!pollData) return null;

  const totalVotes = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const hasVoted = myVotes.length > 0;
  const isEnded = pollData.endsAt !== null && pollData.endsAt <= Date.now() / 1000;
  const showResults = hasVoted || isEnded || (disabled ?? false);
  const maxCount = showResults ? Math.max(0, ...counts.values()) : 0;

  return (
    <div className="space-y-3" role="group" aria-label="Poll">
      {pollData.options.map((option) => (
        <PollOptionRow
          key={option.id}
          optionId={option.id}
          label={option.label}
          count={counts.get(option.id) ?? 0}
          clientCounts={clientCounts.get(option.id)}
          totalVotes={totalVotes}
          isWinner={showResults && (counts.get(option.id) ?? 0) === maxCount && maxCount > 0}
          selected={myVotes.includes(option.id)}
          showResult={showResults}
          disabled={(disabled ?? false) || hasVoted || isEnded}
          pollType={pollData.pollType}
          pollName={`poll-${event.id}`}
          onSelect={() => onVote?.(option.id)}
        />
      ))}
      {totalVotes > 0 && (
        <div className="flex items-center justify-between">
          <p className="xnn-meta text-fg-muted">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </p>
          <PollLegend />
        </div>
      )}
    </div>
  );
}

// PollOptionRow

interface PollOptionRowProps {
  optionId: string;
  label: string;
  count: number;
  clientCounts?: PollClientCounts;
  totalVotes: number;
  isWinner: boolean;
  selected: boolean;
  showResult: boolean;
  disabled: boolean;
  pollType: 'singlechoice' | 'multiplechoice';
  pollName: string;
  onSelect: () => void;
}

function PollOptionRow({
  optionId,
  label,
  count,
  clientCounts,
  totalVotes,
  isWinner,
  selected,
  showResult,
  disabled,
  pollType,
  pollName,
  onSelect,
}: PollOptionRowProps) {
  const breakdown = pollOptionBreakdown(count, clientCounts?.extension ?? 0, totalVotes);
  const { percentage } = breakdown;

  return (
    <label
      className={cx(
        'relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[14px] border px-4 py-3 transition-colors',
        selected
          ? 'border-accent'
          : 'border-line hover:border-line-strong hover:bg-raised',
        disabled && 'cursor-default opacity-80',
      )}
    >
      {/* Stacked vote bar: alien (gray) base + guest (pink) overlay (see PollBar) */}
      {showResult && <PollBar breakdown={breakdown} variant="full" />}

      {/* Radio indicator / check mark */}
      <span
        className={cx(
          'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected
            ? 'border-accent bg-accent text-on-accent'
            : 'border-line-strong bg-canvas',
        )}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <circle cx="5" cy="5" r="3" fill="currentColor" />
          </svg>
        )}
      </span>

      {/* Label */}
      <span className="relative z-10 flex-1 text-body-sm font-medium text-fg">
        {label}
      </span>

      {/* Vote count / percentage — pink only for the winner */}
      {showResult && (
        <span className={cx(
          'relative z-10 shrink-0 tabular-nums text-body-sm',
          isWinner ? 'text-accent font-medium' : 'text-fg-muted',
        )}>
          {percentage}%
          {count > 0 && <span className="ml-1 xnn-meta">({count})</span>}
        </span>
      )}

      {/* Hidden input for form semantics — single-choice uses radio behavior */}
      <input
        type={pollType === 'multiplechoice' ? 'checkbox' : 'radio'}
        name={pollName}
        value={optionId}
        checked={selected}
        disabled={disabled}
        onChange={(e) => {
          if (!disabled && e.currentTarget.checked) onSelect();
        }}
        className="sr-only"
      />
    </label>
  );
}

// PollLegend

function PollLegend() {
  return (
    <div className="flex items-center gap-4 text-caption text-fg-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-[3px] corner-squircle" style={{ backgroundColor: COLOR_GUEST }} />
        <span>Guest</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-[3px] corner-squircle" style={{ backgroundColor: COLOR_ALIEN }} />
        <span>Alien</span>
        <Tooltip.Root>
          <Tooltip.Trigger delay={0} aria-label="What are Aliens?" className="inline-flex items-center p-0.5 text-fg-subtle hover:text-fg-muted transition-colors">
            <InfoIcon />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner className="z-50" sideOffset={6}>
              <Tooltip.Popup className="max-w-64 rounded-md bg-fg px-3 py-2 text-caption text-canvas shadow-raised leading-relaxed">
                An Alien is anyone using a permanent Nostr identity via a browser extension, rather than a disposable guest one.
                <Tooltip.Arrow className="fill-fg" />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </span>
    </div>
  );
}

// Inline poll preview (compact, for PulseRow)

export interface PollInlineProps {
  event: NostrEvent;
  /** Kind 1018 response events for this poll. */
  responses: NostrEvent[];
}

/**
 * PollInline — compact poll summary shown inside a PulseRow.
 * Shows option labels and vote counts without interactive controls.
 * Legend is centered under the poll content area (not the entire row).
 */
export function PollInline({ event, responses }: PollInlineProps) {
  const pollData = parsePollData(event);
  const counts = countPollResponses(responses, event.id);
  const clientCounts = countPollResponsesByClient(responses, event.id);
  const totalVotes = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const maxCount = Math.max(0, ...counts.values());

  if (!pollData || pollData.options.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {pollData.options.slice(0, 4).map((option) => {
        const count = counts.get(option.id) ?? 0;
        const breakdown = pollOptionBreakdown(count, clientCounts.get(option.id)?.extension ?? 0, totalVotes);
        const isWinner = count === maxCount && maxCount > 0;
        return (
          <div key={option.id} className="flex items-center gap-2 xnn-meta">
            <span className={cx(
              'min-w-[2.5rem] text-right tabular-nums',
              isWinner ? 'text-accent font-medium' : 'text-fg-muted',
            )}>{breakdown.percentage}%</span>
            <PollBar breakdown={breakdown} variant="inline" />
            <span className="min-w-0 truncate text-fg-muted">{option.label}</span>
          </div>
        );
      })}
      {pollData.options.length > 4 && (
        <p className="xnn-meta text-fg-subtle">+{pollData.options.length - 4} more options</p>
      )}
    </div>
  );
}

// Icons

function PollIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M18 10a2 2 0 0 0-2-2H4a2 2 0 1 0 0 4h12a2 2 0 0 0 2-2m-8-6a2 2 0 0 0-2-2H4a2 2 0 1 0 0 4h4a2 2 0 0 0 2-2m4 12a2 2 0 0 0-2-2H4a2 2 0 1 0 0 4h8a2 2 0 0 0 2-2" />
    </svg>
  );
}

function TimerIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3h4M12 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
