const columns = Array.from({ length: 12 }, (_, i) => i + 1);

export function GridVisual() {
  return (
    <div className="border border-line bg-inset p-4">
      <p className="mb-3 text-caption text-fg-subtle">12 columns at lg+ (64rem)</p>
      <div className="grid grid-cols-12 gap-1">
        {columns.map((n) => (
          <div
            key={n}
            className="flex h-10 items-center justify-center border border-line bg-accent/15 text-caption text-fg-muted"
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
