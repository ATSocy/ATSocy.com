import { useCopyToClipboard } from '~/lib/ui/useCopyToClipboard';

interface ColorScaleRowProps {
  name: string;
  prefix: string;
  steps: readonly number[];
}

function scaleVar(prefix: string, step: number) {
  return `var(--color-${prefix}-${step})`;
}

export function ColorScaleRow({ name, prefix, steps }: ColorScaleRowProps) {
  const [copy, copied] = useCopyToClipboard<string>();

  return (
    <div className="space-y-2">
      <p className="text-body-sm font-medium text-fg">{name}</p>
      <div className="flex overflow-hidden border border-line">
        {steps.map((step) => {
          const token = `${prefix}-${step}`;
          return (
            <button
              key={step}
              type="button"
              className="group relative h-10 min-w-0 flex-1"
              style={{ backgroundColor: scaleVar(prefix, step) }}
              title={token}
              onClick={() => void copy(token)}
            >
              <span className="absolute inset-x-0 bottom-0 bg-black/55 px-0.5 py-0.5 font-mono text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {step}
              </span>
              {copied === token ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-white">
                  copied
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SemanticSwatchProps {
  name: string;
  token: string;
  cssVar: string;
}

export function SemanticSwatch({ name, token, cssVar }: SemanticSwatchProps) {
  const [copy, copied] = useCopyToClipboard<string>();

  return (
    <button type="button" onClick={() => void copy(token)} className="flex flex-col items-start text-left" title={`Copy ${token}`}>
      <span className="h-12 w-full border border-line" style={{ backgroundColor: `var(${cssVar})` }} />
      <span className="mt-1.5 text-body-sm font-medium text-fg">{name}</span>
      <span className="font-mono text-caption text-fg-subtle">{token}</span>
      {copied === token ? <span className="text-caption text-fg-muted">Copied</span> : null}
    </button>
  );
}
