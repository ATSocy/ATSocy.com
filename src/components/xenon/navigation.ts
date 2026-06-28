/**
 * Xenon docs information architecture — sidebar groups, routes, and prev/next.
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const xenonNav: NavGroup[] = [
  {
    title: 'Foundations',
    items: [
      { label: 'Introduction', href: '/xenon' },
      { label: 'Colors', href: '/xenon/colors' },
      { label: 'Typography', href: '/xenon/typography' },
      { label: 'Materials', href: '/xenon/materials' },
      { label: 'Spacing', href: '/xenon/spacing' },
      { label: 'Layout', href: '/xenon/layout' },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'Overview', href: '/xenon/components' },
      { label: 'Button', href: '/xenon/components/button' },
      { label: 'Input', href: '/xenon/components/text-field' },
      { label: 'Textarea', href: '/xenon/components/textarea' },
      { label: 'Select', href: '/xenon/components/select' },
      { label: 'Checkbox', href: '/xenon/components/checkbox' },
      { label: 'Radio group', href: '/xenon/components/radio-group' },
      { label: 'Switch', href: '/xenon/components/switch' },
      { label: 'Dialog', href: '/xenon/components/dialog' },
      { label: 'Popover', href: '/xenon/components/popover' },
      { label: 'Tooltip', href: '/xenon/components/tooltip' },
      { label: 'Tabs', href: '/xenon/components/tabs' },
      { label: 'Toast', href: '/xenon/components/toast' },
      { label: 'Menu', href: '/xenon/components/menu' },
      { label: 'Scroll area', href: '/xenon/components/scroll-area' },
      { label: 'Card', href: '/xenon/components/card' },
      { label: 'Table', href: '/xenon/components/table' },
      { label: 'Badge', href: '/xenon/components/badge' },
      { label: 'Separator', href: '/xenon/components/separator' },
      { label: 'Avatar', href: '/xenon/components/avatar' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Accessibility', href: '/xenon/accessibility' },
      { label: 'Publishing articles', href: '/guides/contribute' },
      { label: 'Contributing to Xenon', href: '/xenon/contributing' },
    ],
  },
];

const xenonPages: NavItem[] = xenonNav.flatMap((g) => g.items);

export function xenonNeighbors(href: string): { prev?: NavItem; next?: NavItem } {
  const i = xenonPages.findIndex((p) => p.href === href);
  if (i < 0) return {};
  return {
    prev: i > 0 ? xenonPages[i - 1] : undefined,
    next: i < xenonPages.length - 1 ? xenonPages[i + 1] : undefined,
  };
}

export function isActiveNav(href: string, current: string): boolean {
  if (href === '/xenon') return current === '/xenon' || current === '/xenon/';
  if (href === '/xenon/components') {
    return current === '/xenon/components' || current === '/xenon/components/';
  }
  return current === href || current.startsWith(`${href}/`);
}
