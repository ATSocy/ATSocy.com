import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { finalizeEvent, getPublicKey, nip19, SimplePool } from 'nostr-tools';
import { ATSOCY_TOPICS, withAtsocyTags } from '../src/lib/nostr/atsocy-tags';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONTENT_SOURCES = [
  {
    name: 'news',
    dir: path.join(ROOT, 'src/content/news'),
    defaultNostr: true,
    dTag: (slug: string) => slug,
    canonicalPath: (slug: string) => `/${slug}`,
  },
  {
    name: 'kya',
    dir: path.join(ROOT, 'src/content/kya'),
    defaultNostr: true,
    dTag: (slug: string) => `kya/${slug}`,
    canonicalPath: (slug: string) => `/kya/${slug}`,
  },
  {
    name: 'guides',
    dir: path.join(ROOT, 'src/content/guides'),
    defaultNostr: false,
    dTag: (slug: string) => `guides/${slug}`,
    canonicalPath: (slug: string) => `/guides/${slug}`,
  },
] as const;

interface PublishResult {
  slug: string;
  id: string;
  relayResults: { relay: string; ok: boolean; error?: string }[];
}

interface EventTemplate {
  kind: 30023;
  tags: string[][];
  content: string;
}

function parsePrivateKey(input: string): Uint8Array {
  const trimmed = input.trim();
  if (trimmed.startsWith('nsec1')) {
    const decoded = nip19.decode(trimmed);
    if (decoded.type !== 'nsec') {
      throw new Error('Provided bech32 key is not a valid nsec');
    }
    return decoded.data;
  }
  const bytes = Buffer.from(trimmed, 'hex');
  if (bytes.length !== 32) {
    throw new Error('NOSTR_PRIVATE_KEY must be a 32-byte hex string or nsec1 bech32 value');
  }
  return Uint8Array.from(bytes);
}

function toUnixSeconds(date: Date | string | number): number {
  return Math.floor(new Date(date).getTime() / 1000);
}

function shouldPublishToNostr(data: Record<string, unknown>, defaultNostr: boolean): boolean {
  if (data.draft === true) return false;
  if (typeof data.nostr === 'boolean') return data.nostr;
  return defaultNostr;
}

function buildEventTemplate(tags: string[][], content: string): EventTemplate {
  return {
    kind: 30023,
    tags,
    content,
  };
}

function eventFingerprint(template: EventTemplate): string {
  return createHash('sha256').update(JSON.stringify(template)).digest('hex');
}

async function publishPosts(): Promise<PublishResult[]> {
  const privateKeyInput = process.env.NOSTR_PRIVATE_KEY;
  if (!privateKeyInput) {
    throw new Error('NOSTR_PRIVATE_KEY is required for Nostr publishing');
  }

  const relaysInput = process.env.NOSTR_RELAYS;
  if (!relaysInput) {
    throw new Error('NOSTR_RELAYS is required for Nostr publishing');
  }
  const relays = relaysInput
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  if (relays.length === 0) {
    throw new Error('NOSTR_RELAYS must contain at least one relay URL');
  }

  const siteUrl = (process.env.SITE_URL || 'https://atsocy.com').replace(/\/$/, '');

  const sk = parsePrivateKey(privateKeyInput);
  const pk = getPublicKey(sk);
  console.log(`Publishing from public key: ${pk}`);

  const pool = new SimplePool();
  const results: PublishResult[] = [];

  try {
    for (const source of CONTENT_SOURCES) {
      const filenames = await readdir(source.dir);
      const mdFiles = filenames.filter(
        (f) => (f.endsWith('.md') || f.endsWith('.mdx')) && !f.startsWith('template'),
      );

      for (const filename of mdFiles) {
        const filePath = path.join(source.dir, filename);
        const raw = await readFile(filePath, 'utf8');
        const parsed = matter(raw);
        const data = parsed.data as Record<string, unknown>;

        if (!shouldPublishToNostr(data, source.defaultNostr)) {
          if (data.draft === true) {
            console.log(`Skipping draft: ${source.name}/${filename}`);
          } else if (data.nostr === false) {
            console.log(`Skipping nostr: false — ${source.name}/${filename}`);
          }
          continue;
        }

        const slug = path.basename(filename, path.extname(filename));
        const dTag = source.dTag(slug);
        const title = String(data.title ?? '');
        const description = String(data.description ?? '');
        const pubDate = data.pubDate as string | Date;
        const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
        const heroImage = data.heroImage ? String(data.heroImage) : undefined;
        const canonicalUrl = data.canonicalUrl
          ? String(data.canonicalUrl)
          : `${siteUrl}${source.canonicalPath(slug)}`;

        if (!title || !description || !pubDate) {
          throw new Error(`Post ${source.name}/${filename} is missing required frontmatter`);
        }

        const tagsArray: string[][] = [
          ['d', dTag],
          ['title', title],
          ['summary', description],
          ['published_at', String(toUnixSeconds(pubDate))],
          ['canonical_url', canonicalUrl],
        ];

        for (const tag of tags) {
          tagsArray.push(['t', tag]);
        }

        if (heroImage) {
          const imageUrl = heroImage.startsWith('http') ? heroImage : `${siteUrl}${heroImage}`;
          tagsArray.push(['image', imageUrl]);
        }

        const template = buildEventTemplate(
          withAtsocyTags(tagsArray, ATSOCY_TOPICS.editorial),
          parsed.content,
        );
        const publishHash = eventFingerprint(template);
        const existingEventId = typeof data.nostrEventId === 'string' ? data.nostrEventId : undefined;
        const existingPublishHash = typeof data.nostrPublishedHash === 'string' ? data.nostrPublishedHash : undefined;

        if (existingEventId && existingPublishHash === publishHash) {
          console.log(`Skipping unchanged post: ${dTag}`);
          continue;
        }

        // Migration path: existing published posts can record the deterministic
        // hash without forcing an unnecessary replaceable-event republish.
        if (existingEventId && !existingPublishHash) {
          const updated = matter.stringify(parsed.content, { ...data, nostrPublishedHash: publishHash });
          await writeFile(filePath, updated);
          console.log(`Backfilled nostrPublishedHash for ${source.name}/${slug}`);
          continue;
        }

        const event = finalizeEvent(
          {
            ...template,
            created_at: Math.floor(Date.now() / 1000),
          },
          sk,
        );

        const relayResults = await Promise.all(
          relays.map(async (relay) => {
            try {
              const [publishResult] = pool.publish([relay], event);
              await publishResult;
              return { relay, ok: true };
            } catch (err) {
              const error = err instanceof Error ? err.message : String(err);
              console.error(`Failed to publish ${dTag} to ${relay}: ${error}`);
              return { relay, ok: false, error };
            }
          }),
        );

        const okCount = relayResults.filter((r) => r.ok).length;
        console.log(`${dTag}: event ${event.id} confirmed on ${okCount}/${relays.length} relays`);

        results.push({ slug: dTag, id: event.id, relayResults });

        if (data.nostrEventId !== event.id || data.nostrPublishedHash !== publishHash) {
          const updated = matter.stringify(parsed.content, {
            ...data,
            nostrEventId: event.id,
            nostrPublishedHash: publishHash,
          });
          await writeFile(filePath, updated);
          console.log(`Updated nostr metadata for ${source.name}/${slug}`);
        }
      }
    }
  } finally {
    pool.close(relays);
  }

  return results;
}

async function commitChanges(): Promise<void> {
  try {
    execSync('git config user.name "github-actions[bot]"');
    execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
    execSync('git add src/content/news/ src/content/kya/ src/content/guides/');
    execSync('git commit -m "chore: update nostrEventId [skip ci]"');
    execSync('git push');
    console.log('Committed nostrEventId updates');
  } catch (err) {
    console.error('Failed to commit nostrEventId updates:', err);
    throw err;
  }
}

async function main(): Promise<void> {
  const results = await publishPosts();

  const hasSuccess = results.some((r) => r.relayResults.some((x) => x.ok));
  const hasUpdates = results.length > 0;

  if (hasSuccess && hasUpdates && process.env.CI) {
    await commitChanges();
  }

  if (results.length === 0) {
    console.log('No eligible posts to publish.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
