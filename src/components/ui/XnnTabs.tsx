import { Tabs } from '@base-ui/react/tabs';
import type { ComponentProps, ReactElement } from 'react';
import { cx } from '~/lib/ui/cx';

type TabsRootProps = ComponentProps<typeof Tabs.Root>;
type TabsListProps = ComponentProps<typeof Tabs.List>;
type TabsTabProps = ComponentProps<typeof Tabs.Tab>;
type TabsPanelProps = ComponentProps<typeof Tabs.Panel>;

export function XnnTabs({ className, ...props }: TabsRootProps): ReactElement {
  return (
    <Tabs.Root
      className={cx('flex flex-col gap-6', className)}
      {...props}
    />
  );
}

export function XnnTabsList({ className, children, ...props }: TabsListProps): ReactElement {
  return (
    <Tabs.List
      className={cx(
        'relative z-0 flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-[14px] bg-surface-2 p-1 text-fg-muted',
        className,
      )}
      {...props}
    >
      {children}
      <Tabs.Indicator
        className={cx(
          'absolute bottom-0 left-0 -z-10',
          'h-[var(--active-tab-height)] w-[var(--active-tab-width)]',
          'translate-x-[var(--active-tab-left)] -translate-y-[var(--active-tab-bottom)]',
          'rounded-[10px] bg-canvas shadow-panel',
          'transition-[width,translate] duration-200 ease-in-out',
        )}
      />
    </Tabs.List>
  );
}

export function XnnTabsTab({ className, ...props }: TabsTabProps): ReactElement {
  return (
    <Tabs.Tab
      className={cx(
        'relative flex h-9 shrink-0 cursor-pointer items-center justify-center',
        'rounded-[10px] border border-transparent px-4',
        'text-body-sm font-medium outline-none transition-colors',
        'hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40',
        'data-active:text-fg data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function XnnTabsPanel({ className, ...props }: TabsPanelProps): ReactElement {
  return (
    <Tabs.Panel
      className={cx('min-h-[28rem] outline-none', className)}
      {...props}
    />
  );
}
