import { defineCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * News, KYA, and guides — static Markdown/MDX collections.
 * See docs/SITE-ARCHITECTURE.md.
 */
function articleSchema(image: () => z.ZodTypeAny) {
  const heroImageSchema = z.union([image(), z.string()]) as z.ZodType<string | ImageMetadata>;

  return z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      heroImage: heroImageSchema.optional(),
      heroImageAlt: z.string().optional(),
      canonicalUrl: z.url().optional(),
      comments: z.boolean().default(true),
      author: z.string().optional(),
    })
    .refine(
      (data) => !data.heroImage || (data.heroImage && data.heroImageAlt),
      {
        message: 'heroImageAlt is required when heroImage is set',
        path: ['heroImageAlt'],
      },
    );
}

function nostrSchema(image: () => z.ZodTypeAny) {
  return articleSchema(image).extend({
    nostr: z.boolean().default(true),
    nostrEventId: z.string().optional(),
    nostrPublishedHash: z.string().optional(),
  });
}

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: ({ image }) => nostrSchema(image),
});

const kya = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/kya' }),
  schema: ({ image }) => nostrSchema(image),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: ({ image }) => articleSchema(image).extend({
    nostr: z.boolean().default(false),
    nostrEventId: z.string().optional(),
    nostrPublishedHash: z.string().optional(),
  }),
});

export const collections = { news, kya, guides };
