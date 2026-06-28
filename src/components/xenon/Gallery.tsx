/**
 * Xenon component gallery — renders the Base UI inventory as live examples.
 * One `client:visible` island on `/xenon`; each example maps to an inventory
 * entry via the `render` key.
 */
import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Select } from '@base-ui/react/select';
import { Checkbox } from '@base-ui/react/checkbox';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { Switch } from '@base-ui/react/switch';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { Tooltip } from '@base-ui/react/tooltip';
import { Tabs } from '@base-ui/react/tabs';
import { Toast } from '@base-ui/react/toast';
import { Menu } from '@base-ui/react/menu';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Avatar } from '@base-ui/react/avatar';
import { Separator } from '@base-ui/react/separator';
import { InfoIcon } from '~/components/ui/InfoIcon';
import {
  type ComponentDoc,
} from './inventory';

/* Shared token-backed utility strings. */
const CONTROL =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-body text-fg outline-none transition-colors focus:border-accent';
const ITEM =
  'block w-full rounded-sm px-3 py-2 text-left text-body-sm text-fg outline-none data-[highlighted]:bg-raised data-[selected]:font-semibold';

const SELECT_OPTIONS = ['Draft', 'Published', 'Archived'];
const TAB_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
];
const TABLE_ROWS = [
  { token: 'ZNN', sats: '1,204,500', change: '+2.4%' },
  { token: 'QSR', sats: '512,000', change: '-0.8%' },
  { token: 'BTC', sats: '100,000,000', change: '+1.1%' },
];

function ButtonExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button className="xnn-button-solid">Publish</Button>
      <Button className="xnn-button-secondary">Browse all</Button>
      <Button className="xnn-button-ghost">Save draft</Button>
      <Button className="xnn-button-link">Learn more →</Button>
      <Button className="xnn-button-solid" disabled>
        Disabled
      </Button>
    </div>
  );
}

function TextFieldExample() {
  return (
    <Field.Root name="headline" className="w-full max-w-sm">
      <Field.Label className="mb-1.5 block text-body-sm font-medium text-fg">
        Headline
      </Field.Label>
      <Input className={CONTROL} defaultValue="Network of Momentum" />
      <Field.Description className="mt-1.5 text-meta text-fg-subtle">
        Short, descriptive title shown in feeds.
      </Field.Description>
    </Field.Root>
  );
}

function TextareaExample() {
  return (
    <Field.Root name="summary" className="w-full max-w-sm">
      <Field.Label className="mb-1.5 block text-body-sm font-medium text-fg">
        Summary
      </Field.Label>
      <Field.Control
        render={<textarea rows={4} aria-label="Summary" />}
        className={`${CONTROL} resize-y`}
        defaultValue="A brief, scannable summary of the piece."
      />
      <Field.Description className="mt-1.5 text-meta text-fg-subtle">
        Two or three sentences. Supports markdown.
      </Field.Description>
    </Field.Root>
  );
}

function SelectExample() {
  const [value, setValue] = useState<string | null>('Draft');
  return (
    <div className="w-full max-w-sm">
      <Select.Root value={value} onValueChange={setValue}>
        <Select.Trigger className={`${CONTROL} flex items-center justify-between gap-2`}>
          <Select.Value />
          <Select.Icon className="text-fg-subtle">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-50" sideOffset={4}>
            <Select.Popup className="xnn-panel max-h-60 overflow-auto rounded-md p-1 shadow-raised">
              <Select.List>
                {SELECT_OPTIONS.map((v) => (
                  <Select.Item key={v} value={v} className={ITEM}>
                    <Select.ItemText>{v}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function CheckboxExample() {
  const [checked, setChecked] = useState(true);
  return (
    <label htmlFor="checkbox-editorial-updates" className="inline-flex items-center gap-3 text-body-sm text-fg">
      <Checkbox.Root
        id="checkbox-editorial-updates"
        checked={checked}
        onCheckedChange={setChecked}
        className="h-5 w-5 shrink-0 rounded-sm border border-line bg-canvas outline-none transition-colors data-[checked]:border-accent data-[checked]:bg-accent focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Checkbox.Indicator className="flex h-full w-full items-center justify-center text-on-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7.5 5.5 11 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
      Subscribe to editorial updates
    </label>
  );
}

function RadioGroupExample() {
  const [value, setValue] = useState('standard');
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => setValue(v as string)}
      className="flex flex-col gap-2"
    >
      {[
        { value: 'standard', label: 'Standard delivery' },
        { value: 'express', label: 'Express delivery' },
        { value: 'pickup', label: 'Local pickup' },
      ].map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-3 text-body-sm text-fg">
          <Radio.Root
            value={opt.value}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-canvas outline-none data-[checked]:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Radio.Indicator className="block h-2.5 w-2.5 rounded-full bg-accent" />
          </Radio.Root>
          {opt.label}
        </label>
      ))}
    </RadioGroup>
  );
}

function SwitchExample() {
  const [on, setOn] = useState(true);
  return (
    <label htmlFor="switch-desktop-notifications" className="inline-flex items-center gap-3 text-body-sm text-fg">
      <Switch.Root
        id="switch-desktop-notifications"
        checked={on}
        onCheckedChange={setOn}
        className="group h-6 w-11 shrink-0 rounded-full bg-line-strong outline-none transition-colors data-[checked]:bg-accent focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Switch.Thumb className="block h-6 w-6 rounded-full bg-canvas shadow-raised transition-transform group-data-[checked]:translate-x-[1.375rem]" />
      </Switch.Root>
      Desktop notifications
    </label>
  );
}

function DialogExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="xnn-button-solid">Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-fg/30 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2 xnn-panel rounded-card p-6 shadow-raised">
          <Dialog.Title className="xnn-heading-md">Confirm publish</Dialog.Title>
          <Dialog.Description className="mt-2 text-body text-fg-muted">
            This makes the draft visible to everyone. You can still edit it afterwards.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="xnn-button-ghost">Cancel</Dialog.Close>
            <Dialog.Close className="xnn-button-solid">Publish</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PopoverExample() {
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-canvas px-3 py-2 text-body-sm text-fg outline-none transition-colors hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent/40">
        <span>Pushed 3 commits to feature/ui-styling</span>
        <span aria-hidden="true" title="Click to view grouped commits" className="text-fg-subtle">
          <InfoIcon />
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="z-50" sideOffset={8} align="start">
          <Popover.Popup className="xnn-panel w-[min(28rem,calc(100vw-2rem))] rounded-[24px] border border-line bg-surface p-4 shadow-raised outline-none">
            <Popover.Title className="text-body-sm font-semibold text-fg">Recent commits</Popover.Title>
            <div className="mt-3 space-y-3">
              {[
                {
                  sha: '7f3c0af',
                  message: 'refactor: apply semantic colors and improve layout consistency for balances, rewards, and fused amounts',
                  url: 'https://github.com/ATSocy/ATSocy.com/commit/7f3c0af',
                },
                {
                  sha: 'd96c11a',
                  message: 'refactor: remove unused SendHorizontalIcon import and usage in Send.vue',
                  url: 'https://github.com/ATSocy/ATSocy.com/commit/d96c11a',
                },
                {
                  sha: '4f20e18',
                  message: "Merge branch 'pipeline/nom-ui-restyle' into feature/ui-styling",
                  url: 'https://github.com/ATSocy/ATSocy.com/commit/4f20e18',
                },
              ].map((commit) => (
                <a key={commit.sha} href={commit.url} target="_blank" rel="noopener noreferrer" className="block rounded-md px-2 py-1.5 no-underline transition-colors hover:bg-raised">
                  <span className="block truncate text-body-sm text-fg">{commit.message}</span>
                  <span className="mt-1 block font-mono text-caption text-fg-subtle">{commit.sha}</span>
                </a>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TooltipExample() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        aria-label="More options"
        className="xnn-icon-button h-10 w-10 rounded-full border border-line"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="9" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="14" cy="9" r="1.5" />
        </svg>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="z-50" sideOffset={6}>
          <Tooltip.Popup className="rounded-md bg-fg px-2 py-1 text-caption text-canvas shadow-raised">
            More options
            <Tooltip.Arrow className="fill-fg" />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function TabsExample() {
  return (
    <Tabs.Root defaultValue="overview" className="flex w-full flex-col gap-6">
      <Tabs.List aria-label="Section tabs" className="relative z-0 flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-[14px] bg-surface-2 p-1 text-fg-muted">
        {TAB_OPTIONS.map((t) => (
          <Tabs.Tab key={t.value} value={t.value} className="relative flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-transparent px-4 text-body-sm font-medium outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/40 data-active:text-fg data-disabled:pointer-events-none data-disabled:opacity-50">
            {t.label}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className="absolute bottom-0 left-0 -z-10 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-[var(--active-tab-bottom)] rounded-[10px] bg-canvas shadow-panel transition-[width,translate] duration-200 ease-in-out" />
      </Tabs.List>
      <Tabs.Panel value="overview" className="min-h-0 p-4 text-body-sm text-fg outline-none">
        Overview: summary of the current item.
      </Tabs.Panel>
      <Tabs.Panel value="activity" className="min-h-0 p-4 text-body-sm text-fg outline-none">
        Activity: a recent history of changes.
      </Tabs.Panel>
      <Tabs.Panel value="settings" className="min-h-0 p-4 text-body-sm text-fg outline-none">
        Settings: preferences for this item.
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function ToastExample() {
  return (
    <Toast.Provider>
      <ToastTrigger />
    </Toast.Provider>
  );
}

function ToastTrigger() {
  const { toasts, add } = Toast.useToastManager();
  return (
    <>
      <Button
        className="xnn-button-solid"
        onClick={() =>
          add({ title: 'Changes saved', description: 'Your layout draft was updated.' })
        }
      >
        Show toast
      </Button>
      <Toast.Viewport className="fixed bottom-6 right-6 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            toast={t}
            className="xnn-panel flex items-start gap-3 rounded-md p-4 shadow-raised"
          >
            <div className="flex-1">
              <Toast.Title className="text-body-sm font-semibold text-fg">
                {t.title}
              </Toast.Title>
              <Toast.Description className="mt-0.5 text-body-sm text-fg-muted">
                {t.description}
              </Toast.Description>
            </div>
            <Toast.Close
              aria-label="Dismiss notification"
              className="xnn-icon-button h-6 w-6 shrink-0 rounded text-fg-subtle"
            >
              ×
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </>
  );
}

function MenuExample() {
  return (
    <Menu.Root>
      <Menu.Trigger className="xnn-button">Actions ▾</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50" align="start" sideOffset={6}>
          <Menu.Popup className="xnn-panel w-48 rounded-md p-1 shadow-raised">
            <Menu.Item className={ITEM}>Edit</Menu.Item>
            <Menu.Item className={ITEM}>Duplicate</Menu.Item>
            <Menu.Separator className="my-1 h-px bg-line" />
            <Menu.Item className={ITEM}>Delete</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ScrollAreaExample() {
  return (
    <ScrollArea.Root className="relative h-32 w-full max-w-sm overflow-hidden rounded-md border border-line">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="space-y-2 p-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <p key={i} className="text-body-sm text-fg">
              Line {i + 1} of a scrollable region.
            </p>
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2.5 touch-none justify-center bg-inset p-0.5"
      >
        <ScrollArea.Thumb className="flex-1 rounded-full bg-line-strong" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}

function CardExample() {
  return (
    <article className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-panel">
      <p className="xnn-label-sm">Editorial</p>
      <h3 className="mt-2 xnn-heading-sm">
        <a href="#xenon" className="xnn-title-link">
          Designing for NoM interfaces
        </a>
      </h3>
      <p className="mt-2 text-body-sm text-fg-muted">
        How Xenon keeps a network-grade interface consistent and accessible.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="xnn-meta">June 2026</span>
        <span className="inline-flex items-center rounded-pill border border-line px-2.5 py-0.5 xnn-meta">
          #systems
        </span>
      </div>
    </article>
  );
}

function TableExample() {
  return (
    <div className="w-full max-w-sm overflow-x-auto rounded-card border border-line">
      <table className="w-full border-collapse text-body-sm">
        <caption className="sr-only">Token satoshi values and 24h change</caption>
        <thead>
          <tr className="bg-raised text-left">
            <th scope="col" className="border-b border-line px-3 py-2 font-semibold text-fg">Token</th>
            <th scope="col" className="border-b border-line px-3 py-2 text-right font-semibold text-fg">Sats</th>
            <th scope="col" className="border-b border-line px-3 py-2 text-right font-semibold text-fg">24h</th>
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((r) => (
            <tr key={r.token} className="hover:bg-inset">
              <th scope="row" className="border-b border-line px-3 py-2 text-left font-medium text-fg">{r.token}</th>
              <td className="border-b border-line px-3 py-2 text-right text-fg-muted">{r.sats}</td>
              <td className="border-b border-line px-3 py-2 text-right text-fg-muted">{r.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BadgeExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-pill bg-accent-soft px-2.5 py-0.5 text-meta font-medium text-accent-strong">
        New
      </span>
      <span className="inline-flex items-center rounded-pill border border-line px-2.5 py-0.5 text-meta text-fg-muted">
        Draft
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-raised px-2.5 py-0.5 text-meta font-medium text-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Live
      </span>
    </div>
  );
}

function SeparatorExample() {
  return (
    <div className="w-full max-w-sm">
      <p className="text-body-sm text-fg-muted">Section above</p>
      <Separator orientation="horizontal" className="my-4 h-px w-full bg-line" />
      <p className="text-body-sm text-fg-muted">Section below</p>
    </div>
  );
}

function AvatarExample() {
  return (
    <div className="flex items-center gap-3">
      <Avatar.Root className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-raised text-body-sm font-semibold text-fg">
        <Avatar.Image src="/og-image.png" alt="ATSocy" className="h-full w-full object-cover" />
        <Avatar.Fallback>AT</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-body-sm font-semibold text-accent-strong">
        <Avatar.Fallback>ZN</Avatar.Fallback>
      </Avatar.Root>
    </div>
  );
}

const examples: Record<string, () => React.JSX.Element> = {
  button: ButtonExample,
  'text-field': TextFieldExample,
  textarea: TextareaExample,
  select: SelectExample,
  checkbox: CheckboxExample,
  'radio-group': RadioGroupExample,
  switch: SwitchExample,
  dialog: DialogExample,
  popover: PopoverExample,
  tooltip: TooltipExample,
  tabs: TabsExample,
  toast: ToastExample,
  menu: MenuExample,
  'scroll-area': ScrollAreaExample,
  card: CardExample,
  table: TableExample,
  badge: BadgeExample,
  separator: SeparatorExample,
  avatar: AvatarExample,
};

function Showcase({ doc }: { doc: ComponentDoc }) {
  const Example = examples[doc.render];
  return (
    <div className="border border-line bg-inset px-6 py-12">
      <div className="flex min-h-[8rem] items-center justify-center">
        {Example ? <Example /> : null}
      </div>
    </div>
  );
}

// Alias used by `/xenon/components/[slug].astro`. Showcase is the canonical
// name internally; the export reads more naturally at the call site.
export const ComponentShowcase = Showcase;

export function ComponentPreview({ doc }: { doc: ComponentDoc }) {
  return (
    <a
      href={`/xenon/components/${doc.id}`}
      className="grid grid-cols-1 gap-1 border-b border-line py-3 no-underline sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
    >
      <span>
        <span className="block text-body-sm font-medium text-fg">{doc.name}</span>
        <span className="mt-1 inline-flex rounded-full border border-line px-2 py-0.5 text-caption text-fg-subtle">
          {doc.primitive === 'base-ui' ? 'Base UI' : 'Semantic HTML'}
        </span>
      </span>
      <span>
        <span className="block text-body-sm text-fg-muted">{doc.purpose}</span>
        <span className="mt-1 block font-mono text-caption text-fg-subtle">{doc.source}</span>
      </span>
    </a>
  );
}
