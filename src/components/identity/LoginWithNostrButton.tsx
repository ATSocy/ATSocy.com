import { NostrIcon } from '~/components/icons/NostrIcon';

/** Nostr brand purple — icon and label share this when styled as a login action. */
export const NOSTR_PURPLE = '#8B5CF6';

type Props = {
  onClick: () => void;
  className?: string;
};

/** Minimal text button: purple label + Nostr icon suffix. */
export function LoginWithNostrButton({ onClick, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 text-body-sm font-medium transition-opacity hover:opacity-80 hover:cursor-pointer ${className}`.trim()}
      style={{ color: NOSTR_PURPLE }}
    >
      <span>Login with Nostr</span>
      <NostrIcon className="h-4 w-4 shrink-0" style={{ color: NOSTR_PURPLE }} aria-hidden />
    </button>
  );
}
