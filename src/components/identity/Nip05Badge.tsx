import { useNip05 } from '~/lib/identity/useNip05';

/**
 * Verified NIP-05 badge. Renders the domain half of the identifier with a
 * checkmark only after the well-known lookup confirms the pubkey owns it.
 * Unverified claims render nothing — never fake the badge.
 */
export function Nip05Badge({
  pubkey,
  nip05,
}: {
  pubkey: string;
  nip05: string | null;
}) {
  const verified = useNip05(pubkey, nip05);
  if (!verified || !nip05) return null;

  const at = nip05.indexOf('@');
  const domain = at === -1 ? nip05 : nip05.slice(at + 1);

  return (
    <span
      className="inline-flex items-center gap-0.5 text-accent"
      title={`Verified: ${nip05}`}
    >
      <CheckIcon />
      <span className="truncate">{domain}</span>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="0.85em"
      height="0.85em"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="m5 12 5 5L20 7"
      />
    </svg>
  );
}
