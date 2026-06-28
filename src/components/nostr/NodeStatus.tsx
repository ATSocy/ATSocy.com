import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { prefersReducedMotion } from '~/lib/ui/motion';

type Status = 'connecting' | 'connected' | 'error';

const NODE_URL = 'wss://node.atsocy.com:35998';
const NODE_LABEL = NODE_URL.replace(/^wss?:\/\//, '');

function ServerIcon({ status }: { status: Status }) {
  const online = status === 'connected';
  const bodyColor = online ? '#374151' : '#9ca3af';
  const ledColor = online ? 'var(--color-accent)' : '#9ca3af';
  const powerColor = online ? '#22c55e' : '#9ca3af';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="2em"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path fill={bodyColor} d="M3 5v3h10V5zM3 4h10l-2-4H5zm0 8h10V9H3zM3 13h10v3H3zM4 14h3v1H4z" />
      <path fill={powerColor} d="M4 6h3v1H4z" />
      <path
        fill={ledColor}
        style={online ? { animation: 'xnn-led-blink 1.4s ease-in-out infinite' } : undefined}
        d="M11 10h1v1h-1z"
      />
      <path
        fill={ledColor}
        style={online ? { animation: 'xnn-led-blink 1.4s ease-in-out infinite 0.7s' } : undefined}
        d="M9 10h1v1H9z"
      />
    </svg>
  );
}

function NodeStatusInner() {
  const [status, setStatus] = useState<Status>('connecting');
  const statusRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (statusRef.current && !prefersReducedMotion()) {
      gsap.set(statusRef.current, { x: -10, opacity: 0 });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setStatus('error');
    }, 10_000);

    try {
      const ws = new WebSocket(NODE_URL);
      controller.signal.addEventListener('abort', () => ws.close(), { once: true });

      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        setStatus('connected');
        ws.close();
      });

      ws.addEventListener('error', () => {
        if (!controller.signal.aborted) setStatus('error');
      });
    } catch {
      setStatus('error');
    }

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  function handleMouseEnter() {
    if (prefersReducedMotion() || !statusRef.current) return;
    gsap.to(statusRef.current, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
  }

  function handleMouseLeave() {
    if (prefersReducedMotion() || !statusRef.current) return;
    gsap.to(statusRef.current, { x: -10, opacity: 0, duration: 0.2, ease: 'power2.in' });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="text-neutral-700 cursor-default"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Node
      </span>
      <span
        ref={statusRef}
        className="inline-flex items-center gap-1.5 font-mono text-caption text-neutral-400"
      >
        <ServerIcon status={status} />
        {NODE_LABEL}
      </span>
    </span>
  );
}

export function NodeStatus() {
  return (
    <NostrIsland>
      <NodeStatusInner />
    </NostrIsland>
  );
}
