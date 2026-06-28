import { useState } from 'react';
import { usePublish } from '~/lib/nostr/usePublish';

/** Publish kind 0 metadata, preserving existing profile fields. */
export function useSaveProfileName(existingContent: string | undefined) {
  const publish = usePublish();
  const [busy, setBusy] = useState(false);

  async function saveName(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed || busy) return false;
    setBusy(true);
    try {
      let metadata: Record<string, unknown> = {};
      try {
        if (existingContent) metadata = JSON.parse(existingContent);
      } catch {
        /* empty */
      }
      metadata.name = trimmed;
      metadata.display_name = trimmed;
      await publish({ kind: 0, content: JSON.stringify(metadata), tags: [] });
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { saveName, busy };
}
