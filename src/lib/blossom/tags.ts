const IMETA_ORDER = ['url', 'thumb', 'm', 'x', 'dim'] as const;

/** NIP-94 upload tags → NIP-92 `imeta` value parts (everything after the tag name). */
export function nip94TagsToImeta(nip94: readonly string[][]): string[] {
  const byKey = new Map(nip94.map(([key, value]) => [key, value]));
  const parts: string[] = [];
  for (const key of IMETA_ORDER) {
    const value = byKey.get(key);
    if (value) parts.push(`${key} ${value}`);
  }
  return parts;
}

export function imetaTag(parts: readonly string[]): string[] {
  return ['imeta', ...parts];
}

/** Append NIP-92 `alt` to imeta parts when non-empty. */
export function imetaPartsWithAlt(parts: readonly string[], alt: string): string[] {
  const trimmed = alt.trim();
  if (!trimmed) return [...parts];
  return [...parts, `alt ${trimmed}`];
}

export function urlFromImetaParts(parts: readonly string[]): string | null {
  for (const part of parts) {
    const match = part.match(/^url\s+(\S+)/);
    if (match) return match[1];
  }
  return null;
}
