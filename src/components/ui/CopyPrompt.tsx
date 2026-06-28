import { useRef, useEffect } from 'react';
import { useCopyToClipboard } from '~/lib/ui/useCopyToClipboard';
import gsap from 'gsap';

interface CopyPromptProps {
  children: React.ReactNode;
}

export function CopyPrompt({ children }: CopyPromptProps) {
  const [copy, copied] = useCopyToClipboard<string>();
  const contentRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function getText() {
    return contentRef.current?.textContent ?? '';
  }

  useEffect(() => {
    if (copied && btnRef.current) {
      gsap.set(btnRef.current, { scale: 0 });
      gsap.to(btnRef.current, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
    }
  }, [copied]);

  return (
    <div className="relative group bg-inset p-4 pr-12 rounded-[16px] corner-squircle border border-line overflow-hidden">
      <div
        ref={contentRef}
        className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-fg border-0 bg-transparent p-0"
      >
        {children}
      </div>
      <button
        ref={btnRef}
        type="button"
        className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-md bg-raised hover:bg-line transition-colors"
        aria-label="Copy to clipboard"
        onClick={() => void copy(getText())}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="text-accent" aria-hidden="true">
            <path fill="currentColor" fillRule="evenodd" d="M9.53 3.22a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 1.06-1.06l.97.97l3.97-3.97a.75.75 0 0 1 1.06 0" clipRule="evenodd" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
            <path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
