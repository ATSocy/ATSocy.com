import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import gsap from 'gsap';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { prefersReducedMotion } from '~/lib/ui/motion';
import { NOSTR_RELAYS, USE_MOCK_EVENTS } from '~/config/feeds';

type Status = 'connecting' | 'connected' | 'error' | 'mock' | 'unconfigured';

function relayLabel(relays: readonly string[]): string {
  if (relays.length === 0) return 'no relay';
  const host = relays[0].replace(/^wss?:\/\//, '').replace(/\/$/, '');
  return relays.length > 1 ? `${host} +${relays.length - 1}` : host;
}

function ServerIcon({ status }: { status: Status }) {
  const online = status === 'connected' || status === 'mock';
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

function RelayStatusInner() {
  const { nostr } = useNostr();
  const [status, setStatus] = useState<Status>(
    USE_MOCK_EVENTS ? 'mock' : NOSTR_RELAYS.length === 0 ? 'unconfigured' : 'connecting',
  );
  const statusRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    // Only stage the hidden start state when motion is allowed. Under
    // reduced-motion the status is shown statically with no hover reveal.
    if (statusRef.current && !prefersReducedMotion()) {
      gsap.set(statusRef.current, { x: -10, opacity: 0 });
    }
  }, []);

  useEffect(() => {
    if (USE_MOCK_EVENTS || NOSTR_RELAYS.length === 0) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setStatus('error');
    }, 10_000);

    async function probe() {
      try {
        for await (const msg of nostr.req([{ kinds: [1], limit: 1 }], { signal: controller.signal })) {
          if (msg[0] === 'EOSE' || msg[0] === 'EVENT') {
            clearTimeout(timeout);
            setStatus('connected');
            controller.abort();
            return;
          }
        }
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }

    void probe();
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [nostr]);

  const label = USE_MOCK_EVENTS ? 'mock relay' : relayLabel(NOSTR_RELAYS);

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
      <a
        href="https://relay.atsocy.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-700 no-underline"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Relay
      </a>
      <span
        ref={statusRef}
        className="inline-flex items-center gap-1.5 font-mono text-caption text-neutral-400"
      >
        <ServerIcon status={status} />
        {label}
      </span>
    </span>
  );
}

export function NostrRelayStatus() {
  return (
    <NostrIsland>
      <RelayStatusInner />
    </NostrIsland>
  );
}
