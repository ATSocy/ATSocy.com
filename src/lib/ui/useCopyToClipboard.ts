import { useEffect, useRef, useState } from 'react';

/**
 * useCopyToClipboard — write text to the clipboard and track a "copied" token
 * that auto-resets to null after `resetMs`. Returns `[copy, copied]` where
 * `copy` resolves `true` on success (and `false` if the clipboard is blocked).
 *
 * Used everywhere we show transient "copied" confirmation, so the setTimeout
 * dance isn't repeated at each call site.
 */
export function useCopyToClipboard<T extends string>(resetMs = 1200) {
  const [copied, setCopied] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  async function copy(token: T): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(null), resetMs);
      return true;
    } catch {
      return false;
    }
  }

  return [copy, copied] as const;
}
