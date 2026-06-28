import type { ImageMetadata } from 'astro';

export type HeroImage = string | ImageMetadata | undefined;

export function isLocalHeroImage(heroImage: HeroImage): heroImage is ImageMetadata {
  return typeof heroImage === 'object' && heroImage !== null && 'src' in heroImage;
}

export function heroImageSrc(heroImage: HeroImage): string | undefined {
  if (!heroImage) return undefined;
  return typeof heroImage === 'string' ? heroImage : heroImage.src;
}

export function heroImageDimensions(heroImage: HeroImage): { width?: number; height?: number } {
  if (!isLocalHeroImage(heroImage)) return {};
  return { width: heroImage.width, height: heroImage.height };
}
