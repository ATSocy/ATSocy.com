import { useState } from 'react';
import { AlienAvatar } from '@zenon-red/alien-avatars-react';

/**
 * Author avatar: renders the kind-0 `picture` when present, falling back to the
 * deterministic AlienAvatar (seeded by npub) on missing/broken images. Guests
 * have no kind-0 picture, so they always get the alien — no explicit gate.
 */
export function AuthorAvatar({
  npub,
  picture,
  size,
  className,
}: {
  npub: string;
  picture: string | null;
  size: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (picture && !broken) {
    return (
      <img
        src={picture}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        className={className}
      />
    );
  }
  return <AlienAvatar seed={npub} size={size} className={className} />;
}
