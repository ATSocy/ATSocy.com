import { cx } from '~/lib/ui/cx';

/** Shared hit target for calendar days and time stepper cells. */
export const PICKER_CELL = cx(
  'relative flex size-[var(--cell-size)] items-center justify-center rounded-[10px]',
  'text-body-sm text-fg',
  'not-in-data-selected:hover:bg-raised',
  'disabled:pointer-events-none disabled:opacity-50',
  'outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
);

export const PICKER_CELL_BUTTON = cx(
  PICKER_CELL,
  'border-0 bg-transparent cursor-pointer',
);

export const PICKER_CELL_VALUE = cx(
  PICKER_CELL,
  'font-medium tabular-nums bg-accent text-on-accent',
);
