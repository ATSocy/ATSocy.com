import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { cx } from '~/lib/ui/cx';
import { PICKER_CELL_BUTTON, PICKER_CELL_VALUE } from './picker-styles';

type Period = 'AM' | 'PM';

function to12Hour(hour24: number): { hour: number; period: Period } {
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return { hour, period };
}

function to24Hour(hour12: number, period: Period): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function TimeScrollColumn({
  label,
  value,
  options,
  disabled,
  format,
  onChange,
}: {
  label: string;
  value: number | string;
  options: readonly (number | string)[];
  disabled?: boolean;
  format?: (value: number | string) => string;
  onChange: (next: number | string) => void;
}): ReactElement {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center' });
  }, [value]);

  const display = format ?? ((v: number | string) => String(v));

  return (
    <div className="flex min-w-[var(--cell-size)] flex-col items-center gap-1">
      <span className="text-caption font-medium text-fg-muted">{label}</span>
      <ul
        ref={listRef}
        role="listbox"
        aria-label={label}
        className={cx(
          'flex h-[calc(var(--cell-size)*5)] w-full flex-col items-center gap-0.5 overflow-y-auto overscroll-contain',
          'snap-y snap-mandatory scroll-smooth',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <li key={String(option)} role="presentation" className="snap-center">
              <button
                ref={selected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                className={selected ? PICKER_CELL_VALUE : PICKER_CELL_BUTTON}
                onClick={() => onChange(option)}
              >
                {display(option)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1) as readonly number[];
const MINUTES = Array.from({ length: 60 }, (_, i) => i) as readonly number[];
const PERIODS = ['AM', 'PM'] as const;

/** Custom scroll-column time picker — stylable alternative to native type="time". */
export function XnnTimePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}): ReactElement {
  const [hourStr, minuteStr] = value.split(':');
  const hour24 = Math.min(23, Math.max(0, Number(hourStr) || 0));
  const minute = Math.min(59, Math.max(0, Number(minuteStr) || 0));
  const { hour, period } = useMemo(() => to12Hour(hour24), [hour24]);

  const emit = (nextHour12: number, nextMinute: number, nextPeriod: Period) => {
    onChange(`${pad2(to24Hour(nextHour12, nextPeriod))}:${pad2(nextMinute)}`);
  };

  return (
    <div
      id={id}
      aria-label="Time"
      className={cx(
        'flex items-start justify-center gap-1 [--cell-size:2.25rem] sm:[--cell-size:2rem]',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <TimeScrollColumn
        label="Hour"
        value={hour}
        options={HOURS}
        disabled={disabled}
        format={(v) => pad2(Number(v))}
        onChange={(next) => emit(Number(next), minute, period)}
      />
      <span className="mt-[calc(var(--cell-size)+0.25rem)] text-body-sm font-medium text-fg-muted" aria-hidden="true">
        :
      </span>
      <TimeScrollColumn
        label="Min"
        value={minute}
        options={MINUTES}
        disabled={disabled}
        format={(v) => pad2(Number(v))}
        onChange={(next) => emit(hour, Number(next), period)}
      />
      <TimeScrollColumn
        label=""
        value={period}
        options={PERIODS}
        disabled={disabled}
        onChange={(next) => emit(hour, minute, next as Period)}
      />
    </div>
  );
}
