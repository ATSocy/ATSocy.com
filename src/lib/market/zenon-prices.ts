/**
 * Price ticker data layer — the canonical contract for `public/prices.json`.
 *
 * `PriceItem` / `PricesFile` are the single source of truth for the on-disk
 * shape that `scripts/fetch-prices.ts` (producer) writes and this module
 * (consumer) reads. The producer imports these types type-only so the runtime
 * boundary stays clean (Node script ↔ browser fetch).
 */
export interface PriceItem {
  symbol: 'ZNN' | 'QSR';
  sats: number;
  eth: number;
  usd: number;
}

export interface PricesFile {
  updatedAt: string;
  ethUsd: number;
  items: PriceItem[];
}

const PRICES_URL = import.meta.env.DEV ? '/prices.json' : 'https://api.atsocy.com/prices.json';

export async function loadTickerItems(): Promise<PriceItem[]> {
  try {
    const res = await fetch(PRICES_URL);
    if (!res.ok) return [];
    const json = (await res.json()) as Partial<PricesFile>;
    return (json.items ?? []).filter(isPriceItem);
  } catch {
    return [];
  }
}

function isPriceItem(item: unknown): item is PriceItem {
  if (typeof item !== 'object' || item === null) return false;
  const { symbol, sats, eth, usd } = item as Record<string, unknown>;
  return (
    (symbol === 'ZNN' || symbol === 'QSR') &&
    typeof sats === 'number' &&
    !Number.isNaN(sats) &&
    typeof eth === 'number' &&
    !Number.isNaN(eth) &&
    typeof usd === 'number' &&
    !Number.isNaN(usd)
  );
}

/**
 * QSR-per-ZNN ratio for the ticker's `1 ZNN : X QSR` display.
 *
 * The ratio is `znn.sats / qsr.sats` (how many QSR one ZNN buys), NOT the
 * inverse: the old HTML-scraping path returned `qsr.sats / znn.sats` (ZNN-per-QSR),
 * which displayed the wrong number. The data-source migration to `prices.json`
 * fixed it; the zero-guard moved from `znn` to `qsr` accordingly (QSR is now the
 * divisor). Don't "simplify" back to `qsr / znn` without checking the UI contract.
 */
export function getTickerRatioValue(items: PriceItem[]): string | null {
  const znn = items.find((item) => item.symbol === 'ZNN');
  const qsr = items.find((item) => item.symbol === 'QSR');
  if (!znn || !qsr || qsr.sats === 0) return null;
  return (znn.sats / qsr.sats).toFixed(2);
}
