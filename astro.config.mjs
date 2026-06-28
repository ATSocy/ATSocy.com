import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import remarkAtsCommentary from './src/lib/articles/remark-ats-commentary';
import { unified } from '@astrojs/markdown-remark';

const siteUrl = process.env.SITE_URL || 'https://atsocy.com';
const nostrifyDist = fileURLToPath(new URL('./node_modules/@nostrify/react/dist/', import.meta.url));

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  output: 'static',
  compressHTML: true,
  devToolbar: { enabled: false },
  prefetch: {
    defaultStrategy: 'hover',
  },
  env: {
    schema: {
      PUBLIC_NOSTR_RELAYS: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_HOT_PULSE_WINDOW_HOURS: envField.number({ context: 'client', access: 'public', optional: true }),
      PUBLIC_ATS_NPUB: envField.string({ context: 'client', access: 'public', optional: true }),
PUBLIC_BLOSSOM_SERVERS: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkAtsCommentary],
    }),
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/p/')) return false;
        if (path === '/create-post') return false;
        if (path === '/404' || path === '/404.html') return false;
        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      noExternal: ['@nostrify/react', '@primer/react', '@primer/primitives', '@primer/octicons-react'],
      alias: {
        // Allow deep imports into @nostrify/react/dist so we can access the
        // internal NostrLoginContext (not in the package's public exports).
        // Vite resolves to the same file the library uses internally, so the
        // context object identity is preserved.
        '@nostrify/react/dist/': nostrifyDist,
      },
    },
  },
});
