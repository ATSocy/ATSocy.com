import { Popover } from '@base-ui/react/popover';
import { useMemo, type ReactElement } from 'react';
import { cx } from '~/lib/ui/cx';
import { parseDateTimeLocal, setDatePart, setTimePart, toDateTimeLocal } from '~/components/pulse/post-forms';
import { XnnCalendar } from './XnnCalendar';
import { XnnTimePicker } from './XnnTimePicker';

const TRIGGER = cx(
  'inline-flex w-full items-center justify-between gap-3 rounded-[18px] border border-line bg-canvas',
  'px-4 py-3 text-body-sm text-fg outline-none transition-colors',
  'hover:border-accent/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
);

const DATE_LABEL = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function CalendarIcon(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0 text-fg-muted">
      <rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2.5 7.5h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** Date + custom time picker — calendar + scroll-column time (coss has no time stepper). */
export function XnnDateTimePicker({
  id,
  value,
  onChange,
  disabled,
  min,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
}): ReactElement {
  const selected = useMemo(() => parseDateTimeLocal(value), [value]);
  const timeValue = useMemo(() => {
    if (!selected) return '12:00';
    return `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
  }, [selected]);
  const minDate = useMemo(() => (min ? parseDateTimeLocal(min) ?? undefined : undefined), [min]);
  const label = selected ? DATE_LABEL.format(selected) : 'Pick date and time';

  return (
    <Popover.Root>
      <Popover.Trigger
        id={id}
        disabled={disabled}
        className={cx(TRIGGER, disabled && 'cursor-not-allowed opacity-50')}
      >
        <span className={selected ? 'text-fg' : 'text-fg-muted'}>{label}</span>
        <CalendarIcon />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="z-50" sideOffset={8} align="start">
          <Popover.Popup className="xnn-panel rounded-[18px] border border-line bg-surface p-3 shadow-raised">
            <XnnCalendar
              mode="single"
              selected={selected ?? undefined}
              defaultMonth={selected ?? undefined}
              disabled={minDate ? { before: minDate } : undefined}
              onSelect={(date) => {
                if (!date) return;
                const base = selected ?? new Date();
                onChange(setDatePart(toDateTimeLocal(base), date));
              }}
            />
            <div className="mt-3 border-t border-line pt-3">
              <XnnTimePicker
                id={`${id}-time`}
                value={timeValue}
                disabled={disabled}
                onChange={(time) => onChange(setTimePart(value, time))}
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
