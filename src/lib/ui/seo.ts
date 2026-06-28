import { SITE } from '~/site.config';

export const TWITTER_SITE = '@ATSocy';

export const DEFAULT_OG_IMAGE = {
  path: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'ATSocy — Alien Trap Society',
} as const;

/** Absolute site URL for canonical, OG, and JSON-LD. */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = SITE.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveOgImage(
  image?: string,
  alt?: string,
): { url: string; width?: number; height?: number; alt: string } {
  if (!image) {
    return {
      url: absoluteUrl(DEFAULT_OG_IMAGE.path),
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      alt: alt ?? DEFAULT_OG_IMAGE.alt,
    };
  }

  return {
    url: absoluteUrl(image),
    alt: alt ?? DEFAULT_OG_IMAGE.alt,
  };
}

export function toIsoDate(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
