/**
 * Reference data for Xenon foundation pages.
 * `context` fields are short factual labels — not usage guidelines.
 */

const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export interface ColorScale {
  name: string;
  prefix: string;
  steps: readonly number[];
}

export const colorScales: ColorScale[] = [
  { name: 'Neutral', prefix: 'neutral', steps: SCALE_STEPS },
  { name: 'Pink', prefix: 'pink', steps: SCALE_STEPS },
];

export const statusScales: ColorScale[] = [
  { name: 'Green', prefix: 'green', steps: SCALE_STEPS },
  { name: 'Red', prefix: 'red', steps: SCALE_STEPS },
  { name: 'Amber', prefix: 'amber', steps: SCALE_STEPS },
];

export interface SemanticColor {
  name: string;
  token: string;
  cssVar: string;
}

export const semanticColors: SemanticColor[] = [
  { name: 'Canvas', token: 'bg-canvas', cssVar: '--color-canvas' },
  { name: 'Surface', token: 'bg-surface', cssVar: '--color-surface' },
  { name: 'Surface 2', token: 'bg-surface-2', cssVar: '--color-surface-2' },
  { name: 'Raised', token: 'bg-raised', cssVar: '--color-raised' },
  { name: 'Inset', token: 'bg-inset', cssVar: '--color-inset' },
  { name: 'Foreground', token: 'text-fg', cssVar: '--color-fg' },
  { name: 'Muted', token: 'text-fg-muted', cssVar: '--color-fg-muted' },
  { name: 'Subtle', token: 'text-fg-subtle', cssVar: '--color-fg-subtle' },
  { name: 'Accent', token: 'bg-accent', cssVar: '--color-accent' },
  { name: 'Accent soft', token: 'bg-accent-soft', cssVar: '--color-accent-soft' },
  { name: 'Accent strong', token: 'text-accent-strong', cssVar: '--color-accent-strong' },
  { name: 'On accent', token: 'text-on-accent', cssVar: '--color-on-accent' },
  { name: 'Line', token: 'border-line', cssVar: '--color-line' },
  { name: 'Line strong', token: 'border-line-strong', cssVar: '--color-line-strong' },
];

export interface TypeSpec {
  sample: string;
  className: string;
  context: string;
}

export const headingScale: TypeSpec[] = [
  { sample: 'Display', className: 'xnn-display', context: 'Page heroes.' },
  { sample: 'Heading XL', className: 'xnn-heading-xl', context: 'Major section titles.' },
  { sample: 'Heading LG', className: 'xnn-heading-lg', context: 'Section headings.' },
  { sample: 'Heading MD', className: 'xnn-heading-md', context: 'Subsection titles.' },
  { sample: 'Heading SM', className: 'xnn-heading-sm', context: 'Card and list titles.' },
];

export const bodyScale: TypeSpec[] = [
  { sample: 'Body large', className: 'text-body-lg text-fg-muted', context: 'Lead paragraphs.' },
  { sample: 'Body', className: 'text-body text-fg', context: 'Default UI copy.' },
  { sample: 'Body small', className: 'text-body-sm text-fg-muted', context: 'Dense UI.' },
  { sample: 'Meta', className: 'xnn-meta', context: 'Timestamps, counts.' },
  { sample: 'Caption', className: 'text-caption text-fg-subtle', context: 'Fine print.' },
];

export interface MaterialSpec {
  name: string;
  className: string;
  context: string;
  tier: 'surface' | 'floating';
}

export const materials: MaterialSpec[] = [
  { name: 'Base', className: 'xds-material-base rounded-[12px] corner-squircle', context: 'Radius 12px squircle.', tier: 'surface' },
  { name: 'Small', className: 'xds-material-small rounded-[12px] corner-squircle', context: 'Radius 12px. Shadow panel.', tier: 'surface' },
  { name: 'Medium', className: 'xds-material-medium rounded-[12px] corner-squircle', context: 'Radius 12px. Shadow raised.', tier: 'surface' },
  { name: 'Panel', className: 'xnn-panel rounded-md', context: 'Menus and popovers.', tier: 'floating' },
  { name: 'Modal', className: 'xds-material-modal', context: 'Dialogs.', tier: 'floating' },
];

export const spacingScale: { token: string; value: string; px: string }[] = [
  { token: '1', value: '0.25rem', px: '4px' },
  { token: '2', value: '0.5rem', px: '8px' },
  { token: '3', value: '0.75rem', px: '12px' },
  { token: '4', value: '1rem', px: '16px' },
  { token: '5', value: '1.25rem', px: '20px' },
  { token: '6', value: '1.5rem', px: '24px' },
  { token: '8', value: '2rem', px: '32px' },
  { token: '10', value: '2.5rem', px: '40px' },
  { token: '12', value: '3rem', px: '48px' },
  { token: '16', value: '4rem', px: '64px' },
  { token: '20', value: '5rem', px: '80px' },
];

export const containers = [
  { className: 'max-w-reading', context: '48rem' },
  { className: 'max-w-wide', context: '64rem' },
  { className: 'max-w-page', context: '96rem' },
  { className: 'max-w-editorial', context: '47.5rem' },
];

export const breakpoints = [
  { name: 'sm', value: '40rem' },
  { name: 'md', value: '48rem' },
  { name: 'lg', value: '64rem' },
  { name: 'xl', value: '80rem' },
  { name: '2xl', value: '96rem' },
];

export const layoutRegions = [
  { name: 'Header', context: 'Brand, navigation, search.' },
  { name: 'Sidebar', context: 'Secondary navigation.' },
  { name: 'Main', context: 'Primary content.' },
  { name: 'Panel', context: 'Grouped content within a region.' },
  { name: 'Footer', context: 'Secondary links, identity.' },
];

export const gridBreakpoints = [
  { name: 'base', minWidth: '—', columns: '4', gutter: '1rem' },
  { name: 'md', minWidth: '48rem', columns: '8', gutter: '1rem' },
  { name: 'lg', minWidth: '64rem', columns: '12', gutter: '1rem' },
];

export const gridClasses = [
  { className: 'xnn-grid', context: 'Fluid column grid; count follows breakpoint.' },
  { className: 'xnn-grid--flush', context: 'No column gap; borders separate cells.' },
  { className: 'xnn-col-span-full', context: 'Span all columns at every breakpoint.' },
  { className: 'lg:xnn-col-span-{n}', context: 'Span n columns from lg (n = 1–12).' },
  { className: 'lg:xnn-col-start-{n}', context: 'Start at column n from lg (n = 1–12).' },
];

export const gridRecipes = [
  { page: 'Home', layout: '3 · 6 · 3', classes: 'lg:xnn-col-span-3 · lg:xnn-col-span-6 · lg:xnn-col-span-3' },
  { page: 'Article', layout: '2 · 8 · 2', classes: 'lg:xnn-col-span-2 · lg:xnn-col-span-8 · lg:xnn-col-span-2' },
  { page: 'Participate', layout: '8 centered', classes: 'lg:xnn-col-span-8 lg:xnn-col-start-3' },
  { page: 'Pulse', layout: '12', classes: 'xnn-col-span-full' },
];
