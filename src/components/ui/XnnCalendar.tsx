import { DayPicker, type DayPickerProps } from 'react-day-picker';
import type { ReactElement } from 'react';
import { cx } from '~/lib/ui/cx';
import { PICKER_CELL } from './picker-styles';

function ChevronIcon({
  className,
  orientation,
}: {
  className?: string;
  orientation?: 'left' | 'right' | 'up' | 'down';
}): ReactElement {
  if (orientation === 'left') {
    return (
      <svg className={cx(className, 'rtl:rotate-180')} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12 6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (orientation === 'right') {
    return (
      <svg className={cx(className, 'rtl:rotate-180')} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6h8M8 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function XnnCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps): ReactElement {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cx('w-fit [--cell-size:2.25rem] sm:[--cell-size:2rem]', className)}
      classNames={{
        button_next: PICKER_CELL,
        button_previous: PICKER_CELL,
        caption_label: 'flex h-full items-center gap-2 text-body-sm font-medium text-fg',
        day: 'size-[var(--cell-size)] py-px text-body-sm',
        day_button: cx(
          PICKER_CELL,
          'in-data-disabled:pointer-events-none in-data-disabled:text-fg-muted/60',
          'in-data-outside:text-fg-muted/70',
          'in-data-selected:bg-accent in-data-selected:text-on-accent',
          'in-data-selected:in-data-outside:text-on-accent',
        ),
        hidden: 'invisible',
        month: 'w-full',
        month_caption: 'relative mx-[var(--cell-size)] mb-1 flex h-[var(--cell-size)] items-center justify-center',
        months: 'relative flex flex-col gap-2',
        nav: 'absolute inset-x-0 top-0 z-10 flex justify-between',
        outside: 'text-fg-muted',
        today: cx(
          '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2',
          '*:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-accent',
          '[&[data-selected]:not(.range-middle)>*]:after:bg-on-accent',
        ),
        weekday: 'size-[var(--cell-size)] p-0 text-caption font-medium text-fg-muted',
        weekdays: 'flex',
        week: 'mt-1 flex w-full',
        ...classNames,
      }}
      components={{
        Chevron: ChevronIcon,
      }}
      {...props}
    />
  );
}
