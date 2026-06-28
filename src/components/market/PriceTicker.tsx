import { useEffect, useState } from 'react';
import { getTickerRatioValue, loadTickerItems, type PriceItem } from '~/lib/market/zenon-prices';

function SatsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" className="text-fg-subtle">
      <path
        fill="currentColor"
        d="M10 19v2h1v-2h2v2h1v-2h.5c2.21 0 4-1.79 4-4c0-1.32-.65-2.48-1.64-3.21c.7-.72 1.14-1.7 1.14-2.79c0-2.21-1.79-4-4-4V3h-1v2h-2V3h-1v2H6v2h2v10H6v2zm4-12c1.1 0 2 .9 2 2s-.9 2-2 2h-4V7zm-4 6h4.5c1.1 0 2 .9 2 2s-.9 2-2 2H10z"
      />
    </svg>
  );
}

function TickerQuote({ item, loading }: { item: PriceItem; loading?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={`/${item.symbol}.svg`} alt="" className="h-3.5 w-3.5 opacity-80" loading="lazy" />
      <span className="text-fg-muted">{item.symbol}</span>
      <span className="inline-flex items-center gap-1 text-fg-subtle">
        <SatsIcon />
        {loading ? (
          <span className="xnn-skeleton-shimmer h-2.5 w-10 rounded-sm" aria-hidden="true" />
        ) : (
          <span className="font-mono text-fg tabular-nums">{item.sats.toLocaleString('en-US')}</span>
        )}
      </span>
    </span>
  );
}

function TickerRatio({ value, loading }: { value: string; loading?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 border-x border-line/50 px-5">
      <span className="xnn-meta">Ratio</span>
      <span className="font-mono text-fg tabular-nums">
        1 <span className="text-fg-subtle">:</span>{' '}
        {loading ? (
          <span className="xnn-skeleton-shimmer inline-block h-2.5 w-8 translate-y-[-1px] rounded-sm align-middle" aria-hidden="true" />
        ) : (
          value
        )}
      </span>
    </span>
  );
}

const ZNN_PLACEHOLDER: PriceItem = { symbol: 'ZNN', sats: 0, eth: 0, usd: 0 };
const QSR_PLACEHOLDER: PriceItem = { symbol: 'QSR', sats: 0, eth: 0, usd: 0 };

export interface PriceTickerProps {
  items: PriceItem[];
}

export function PriceTicker({ items: initialItems }: PriceTickerProps) {
  const [items, setItems] = useState<PriceItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);

  useEffect(() => {
    if (initialItems.length > 0) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function load(attempt = 0) {
      const next = await loadTickerItems();
      if (cancelled) return;
      if (next.length === 0 && attempt < 3) {
        retryTimer = setTimeout(() => void load(attempt + 1), 3000 * (attempt + 1));
        return;
      }
      setItems(next);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [initialItems]);

  const znn = items.find((item) => item.symbol === 'ZNN') ?? (loading ? ZNN_PLACEHOLDER : null);
  const qsr = items.find((item) => item.symbol === 'QSR') ?? (loading ? QSR_PLACEHOLDER : null);
  const ratioValue = getTickerRatioValue(items);

  if (!loading && items.length === 0) {
    return (
      <div className="border-t border-line bg-inset" aria-label="Zenon prices">
        <div className="mx-auto flex h-8 max-w-page items-center justify-center gap-5 overflow-x-auto px-4 text-caption whitespace-nowrap sm:px-6 lg:px-8">
          <span className="text-fg-subtle">Prices unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-inset" aria-label="Zenon prices">
      <div className="mx-auto flex h-8 max-w-page items-center justify-center gap-5 overflow-x-auto px-4 text-caption whitespace-nowrap sm:px-6 lg:px-8">
        {znn && <TickerQuote item={znn} loading={loading} />}
        <TickerRatio value={ratioValue ?? ''} loading={loading} />
        {qsr && <TickerQuote item={qsr} loading={loading} />}
      </div>
    </div>
  );
}
