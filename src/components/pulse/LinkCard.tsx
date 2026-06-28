import { displayUrl } from '~/lib/nostr/events';
import { ExternalLinkIcon } from '~/components/icons/ExternalLinkIcon';

export interface LinkCardProps {
  url: string;
}

export function LinkCard({ url }: LinkCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex max-w-full items-center gap-3 rounded-[18px] corner-squircle border border-line px-4 py-3 no-underline"
    >
      <span className="min-w-0 break-all text-body-sm font-medium text-accent">
        {displayUrl(url)}
      </span>
      <span className="shrink-0 text-fg-muted">
        <ExternalLinkIcon />
      </span>
    </a>
  );
}
