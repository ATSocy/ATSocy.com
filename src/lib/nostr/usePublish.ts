import { useNostr } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { type PublishTemplate } from '~/lib/nostr/events';
import type { NostrEvent } from '@nostrify/types';

function isReactionsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.some((part) => part === 'reactions');
}

export type { PublishTemplate };

/**
 * usePublish — sign + publish an event via the current user's signer, then
 * invalidate every Nostr query so the new/changed event surfaces in whatever
 * view (Pulse, post detail, profile, community rail) is mounted.
 *
 * Throws if there's no signer, or if the signer rejects (e.g. the user dismisses
 * a NIP-07 prompt). Callers should catch and revert any optimistic UI.
 *
 * Works identically for the guest nsec signer (silent) and NIP-07 extension
 * (prompts per the extension's grant model).
 */
export function usePublish() {
  const { nostr } = useNostr();
  const user = useCurrentUser();
  const qc = useQueryClient();

  return async (template: PublishTemplate): Promise<NostrEvent> => {
    if (!user) throw new Error('Sign in to publish.');
    const event = await user.signer.signEvent({
      ...template,
      created_at: Math.floor(Date.now() / 1000),
    });
    await nostr.event(event);
    if (template.kind === 7) {
      qc.setQueriesData<NostrEvent[]>(
        { queryKey: ['nostr'], predicate: (q) => isReactionsQueryKey(q.queryKey) },
        (old) => {
          if (!old?.length) return [event];
          if (old.some((e) => e.id === event.id)) return old;
          return [...old, event];
        },
      );
    } else {
      void qc.invalidateQueries({ queryKey: ['nostr'] });
    }
    return event;
  };
}
