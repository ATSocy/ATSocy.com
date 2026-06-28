import { BlossomUploader } from '@nostrify/nostrify/uploaders';
import { useCallback, useMemo } from 'react';
import { BLOSSOM_SERVERS } from '~/config/blossom';
import { nip94TagsToImeta } from '~/lib/blossom/tags';
import { useCurrentUser } from '~/lib/identity/useCurrentUser';

/**
 * Upload a file to Blossom (kind 24242 auth) and return NIP-92 `imeta` parts.
 */
export function useBlossomUpload() {
  const user = useCurrentUser();

  const uploader = useMemo(() => {
    if (!user) return null;
    return new BlossomUploader({
      servers: [...BLOSSOM_SERVERS],
      signer: user.signer,
    });
  }, [user]);

  return useCallback(
    async (file: File, signal?: AbortSignal): Promise<string[]> => {
      if (!uploader) throw new Error('Sign in to upload media.');
      const nip94 = await uploader.upload(file, { signal });
      const parts = nip94TagsToImeta(nip94);
      if (parts.length === 0) throw new Error('Upload succeeded but returned no media URL.');
      return parts;
    },
    [uploader],
  );
}
