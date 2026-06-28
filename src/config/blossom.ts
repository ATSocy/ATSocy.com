import { PUBLIC_BLOSSOM_SERVERS } from 'astro:env/client';

function parseBlossomServers(input: string | undefined): readonly string[] {
  if (!input?.trim()) return ['https://media.atsocy.com'];
  return input.split(',').map((server) => server.trim()).filter(Boolean);
}

/** Blossom media servers for Pulse uploads. Override with PUBLIC_BLOSSOM_SERVERS (comma-separated). */
export const BLOSSOM_SERVERS = parseBlossomServers(PUBLIC_BLOSSOM_SERVERS);
