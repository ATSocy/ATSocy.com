import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from 'cnfast';

/**
 * Badge — adapted from coss.com/ui's Badge, styled with Xenon tokens.
 * coss → Xenon token mapping:
 *   bg-primary / text-primary-foreground → accent / on-accent
 *   border-input / bg-background → line / surface
 *   bg-secondary / text-secondary-foreground → raised / fg
 *   destructive → red;  info → accent;  success → green;  warning → amber
 */
export const badgeVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] corner-squircle border border-transparent font-mono font-medium outline-none transition-colors [&_svg:not([class*=opacity-])]:opacity-80 [&_svg:not([class*=size-])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-5.5 min-w-5.5 px-1.5 py-px text-caption sm:h-4.5 sm:min-w-4.5 sm:text-meta',
        lg: 'h-6.5 min-w-6.5 px-2 py-0.5 text-meta sm:h-5.5 sm:min-w-5.5 sm:text-sm',
        sm: 'h-5 min-w-5 px-1 py-px text-[.625rem] sm:h-4 sm:min-w-4',
      },
      variant: {
        default: 'bg-accent text-on-accent',
        outline: 'border-line-strong bg-surface text-fg',
        secondary: 'bg-raised text-fg',
        destructive: 'bg-red-600 text-white',
        error: 'bg-red-50 text-red-700',
        info: 'bg-accent-soft text-accent-strong',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-amber-50 text-amber-700',
      },
    },
  },
);

export interface BadgeProps extends useRender.ComponentProps<'span'> {
  variant?: VariantProps<typeof badgeVariants>['variant'];
  size?: VariantProps<typeof badgeVariants>['size'];
}

export function Badge({
  className,
  variant,
  size,
  render,
  ...props
}: BadgeProps): React.ReactElement {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ className, size, variant })), 'data-slot': 'badge' },
      props,
    ),
    render,
  });
}
