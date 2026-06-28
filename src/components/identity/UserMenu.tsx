import { Menu } from '@base-ui/react/menu';
import { useNostrLogin } from '@nostrify/react/login';
import { AlienAvatar } from '@zenon-red/alien-avatars-react';
import { nip19 } from 'nostr-tools';
import gsap from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NostrIsland } from '~/components/nostr/NostrIsland';
import { DisplayNameEditor } from '~/components/identity/DisplayNameEditor';
import { EditNameIcon } from '~/components/identity/EditNameIcon';
import { useProfileName } from '~/lib/identity/useProfileName';
import { shortNpub } from '~/lib/identity/nostr-identity';

import { useCurrentUser } from '~/lib/identity/useCurrentUser';
import { useLoginActions } from '~/lib/identity/useLoginActions';
import { useCopyToClipboard } from '~/lib/ui/useCopyToClipboard';
import { useNip07ExtensionState } from '~/lib/identity/useNip07Extension';
import { LoginWithNostrButton } from '~/components/identity/LoginWithNostrButton';

function UserMenuTriggerSkeleton() {
  return (
    <>
      <span
        aria-hidden="true"
        className="xnn-skeleton-shimmer hidden h-7 w-16 rounded-[16px] corner-squircle sm:block"
      />
      <span
        aria-hidden="true"
        className="xnn-skeleton-shimmer h-[26px] w-[26px] rounded-full"
      />
    </>
  );
}

const DICE_FRAMES = [
  'M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153m.926 82.855a31.953 18.96 0 0 1 22.127 32.362a31.953 18.96 0 1 1-45.188-26.812a31.953 18.96 0 0 1 23.06-5.55zM75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zM89.297 195.77a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m221.52 64.664A18.008 31.236 31.906 0 1 322 275.637a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zM145.296 289.1a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 0 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m277.523 29.38A18.008 31.236 31.906 0 1 434 333.684a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.184zm-221.52 64.663a31.236 18.008 58.094 0 1 33.817 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203z',
  'M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153m1.86 12.423a31.953 18.96 0 0 1 21.194 5.536a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.347zm58.43 35.208a31.953 18.96 0 0 1 22.13 32.363a31.953 18.96 0 0 1-45.19-26.813a31.953 18.96 0 0 1 23.06-5.55m-177.603 34.98a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.813a31.953 18.96 0 0 1 23.992-32.348zm237.903.26a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.812a31.953 18.96 0 0 1 23.993-32.347m-179.03 35.21a31.953 18.96 0 0 1 22.127 32.362a31.953 18.96 0 1 1-45.187-26.812a31.953 18.96 0 0 1 23.06-5.55M75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zM89.297 195.77a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m333.52 0A18.008 31.236 31.906 0 1 434 210.973a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zm-165.198 2.314a31.953 18.96 0 0 1 21.194 5.535a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.348zm-56.323 62.35a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m109.52 0A18.008 31.236 31.906 0 1 322 275.637a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zM145.296 289.1a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 0 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m-55.998 29.38a31.236 18.008 58.094 0 1 33.818 41.184a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.204m333.52 0A18.008 31.236 31.906 0 1 434 333.684a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.184m-221.52 64.663a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m109.52 0A18.008 31.236 31.906 0 1 322 398.346a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183',
  'M255.75 44.813c-6.187 0-12.75 1.563-17.125 4.093L85.875 137.28c-4.375 2.532-7.094 6.33-7.094 9.907c0 3.58 2.69 7.376 7.064 9.907l152.78 88.375c4.376 2.53 10.94 4.093 17.126 4.093s12.782-1.564 17.156-4.094l152.75-88.376c4.375-2.53 7.094-6.328 7.094-9.906c0-3.58-2.75-7.376-7.125-9.907l-152.75-88.374c-4.375-2.53-10.938-4.094-17.125-4.093zm0 12.343a31.953 18.96 0 0 1 23.063 5.563a31.953 18.96 0 0 1-45.188 26.81a31.953 18.96 0 0 1 20.813-32.343a31.953 18.96 0 0 1 1.312-.03M75.07 173.95c-1.497.048-2.873.402-4.033 1.07c-3.094 1.787-5.033 6.043-5.033 11.095v157.688c0 5.052 1.94 11.547 5.033 16.906s7.723 10.27 12.098 12.796l146.945 84.857c4.375 2.527 9.03 2.974 12.123 1.188c3.094-1.785 5.008-6.056 5.008-11.11V290.755c0-5.052-1.913-11.532-5.007-16.89c-3.094-5.36-7.748-10.255-12.123-12.782L83.135 176.225c-2.735-1.58-5.57-2.352-8.065-2.274zm361.97.017c-2.504-.083-5.348.684-8.083 2.263L282.04 261.07c-4.376 2.527-9.03 7.456-12.124 12.815l-.082.14c-3.047 5.332-4.926 11.71-4.926 16.72v157.718c0 5.052 1.914 9.323 5.008 11.11c3.094 1.785 7.748 1.305 12.123-1.22l146.917-84.84c4.375-2.528 9.03-7.423 12.125-12.783c3.094-5.36 5.033-11.853 5.033-16.906v-157.72c0-5.05-1.94-9.275-5.033-11.06c-1.16-.67-2.54-1.028-4.043-1.077zm-14.222 21.803A18.008 31.236 31.906 0 1 434 210.973a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183m-167.068 2.292a31.953 18.96 0 0 1 23.063 5.563a31.953 18.96 0 0 1-45.188 26.813a31.953 18.96 0 0 1 20.813-32.344a31.953 18.96 0 0 1 1.312-.03zM145.295 289.1a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 0 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m221.525 0a18.008 31.236 31.906 0 1 .002 0a18.008 31.236 31.906 0 1 11.18 15.203a18.008 31.236 31.906 0 1-45 25.98A18.008 31.236 31.906 0 1 366.82 289.1m-56.002 94.043A18.008 31.236 31.906 0 1 322 398.346a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183',
  'M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153m1.86 12.423a31.953 18.96 0 0 1 21.194 5.536a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.347zm-119.173 70.188a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.813a31.953 18.96 0 0 1 23.992-32.348zm118.24.244a31.953 18.96 0 0 1 22.125 32.362a31.953 18.96 0 1 1-45.187-26.812a31.953 18.96 0 0 1 23.06-5.55zm119.663.015a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.812a31.953 18.96 0 0 1 23.993-32.347M75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zM89.297 195.77a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m333.52 0A18.008 31.236 31.906 0 1 434 210.973a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zm-165.198 2.314a31.953 18.96 0 0 1 21.194 5.535a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.348zm109.198 30.018A18.008 31.236 31.906 0 1 378 243.305a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zm-165.52 32.332a31.236 18.008 58.094 0 1 33.817 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203zm109.52 0A18.008 31.236 31.906 0 1 322 275.637a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zM89.298 318.48a31.236 18.008 58.094 0 1 33.817 41.184a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.204m333.52 0A18.008 31.236 31.906 0 1 434 333.684a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.184m-56 32.332A18.008 31.236 31.906 0 1 378 366.017a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zm-165.52 32.33a31.236 18.008 58.094 0 1 33.817 41.184a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203zm109.52 0A18.008 31.236 31.906 0 1 322 398.347a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183z',
  'M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153m1.86 12.423a31.953 18.96 0 0 1 21.194 5.536a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.347zm-119.173 70.188a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.813a31.953 18.96 0 0 1 23.992-32.348zm237.903.26a31.953 18.96 0 0 1 .002 0a31.953 18.96 0 0 1 21.195 5.535a31.953 18.96 0 0 1-45.19 26.812a31.953 18.96 0 0 1 23.993-32.347M75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zM89.297 195.77a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m333.52 0A18.008 31.236 31.906 0 1 434 210.973a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zm-165.198 2.314a31.953 18.96 0 0 1 21.194 5.535a31.953 18.96 0 0 1-45.187 26.812a31.953 18.96 0 0 1 23.992-32.348zM89.296 256.77a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.202zm112 3.664a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m109.52 0A18.008 31.236 31.906 0 1 322 275.637a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183zM366.82 289.1a18.008 31.236 31.906 0 1 .002 0a18.008 31.236 31.906 0 1 11.18 15.203a18.008 31.236 31.906 0 1-45 25.98A18.008 31.236 31.906 0 1 366.82 289.1M89.297 318.48a31.236 18.008 58.094 0 1 33.818 41.184a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.204m333.52 0A18.008 31.236 31.906 0 1 434 333.684a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.184zm-221.52 2.954a31.236 18.008 58.094 0 1 33.818 41.183a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203m0 61.71a31.236 18.008 58.094 0 1 33.818 41.182a31.236 18.008 58.094 1 1-45-25.98a31.236 18.008 58.094 0 1 11.182-15.203zm109.52 0A18.008 31.236 31.906 0 1 322 398.345a18.008 31.236 31.906 0 1-45 25.98a18.008 31.236 31.906 0 1 33.818-41.183z',
];

function DiceIcon({ rolling, onRollEnd }: { rolling?: boolean; onRollEnd?: () => void }) {
  const pathRef = useRef<SVGPathElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(Math.floor(Math.random() * DICE_FRAMES.length));

  const showFrame = useCallback((index: number) => {
    frameRef.current = ((index % DICE_FRAMES.length) + DICE_FRAMES.length) % DICE_FRAMES.length;
    if (pathRef.current) pathRef.current.setAttribute('d', DICE_FRAMES[frameRef.current]);
  }, []);

  useEffect(() => {
    showFrame(frameRef.current);
  }, [showFrame]);

  useEffect(() => {
    if (!rolling) return;

    const nextFace = Math.floor(Math.random() * DICE_FRAMES.length);
    const el = wrapperRef.current;
    if (!el) return;

    const tl = gsap.timeline();
    tl.to(el, {
      rotation: 180,
      duration: 0.25,
      ease: 'power2.in',
    })
    .call(() => showFrame(nextFace))
    .to(el, {
      rotation: 360,
      duration: 0.25,
      ease: 'power2.out',
    })
    .call(() => onRollEnd?.());

    return () => { tl.kill(); gsap.set(el, { rotation: 0 }); };
  }, [rolling, showFrame, onRollEnd]);

  return (
    <span ref={wrapperRef} className="inline-block" style={{ lineHeight: 0 }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 512 512" aria-hidden="true">
        <path ref={pathRef} fill="currentColor" d={DICE_FRAMES[0]} />
      </svg>
    </span>
  );
}

function SignOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14.945 1.25c-1.367 0-2.47 0-3.337.117c-.9.12-1.658.38-2.26.981c-.524.525-.79 1.17-.929 1.928c-.135.737-.161 1.638-.167 2.72a.75.75 0 0 0 1.5.008c.006-1.093.034-1.868.142-2.457c.105-.566.272-.895.515-1.138c.277-.277.666-.457 1.4-.556c.755-.101 1.756-.103 3.191-.103h1c1.436 0 2.437.002 3.192.103c.734.099 1.122.28 1.4.556c.276.277.456.665.555 1.4c.102.754.103 1.756.103 3.191v8c0 1.435-.001 2.436-.103 3.192c-.099.734-.279 1.122-.556 1.399s-.665.457-1.399.556c-.755.101-1.756.103-3.192.103h-1c-1.435 0-2.436-.002-3.192-.103c-.733-.099-1.122-.28-1.399-.556c-.243-.244-.41-.572-.515-1.138c-.108-.589-.136-1.364-.142-2.457a.75.75 0 1 0-1.5.008c.006 1.082.032 1.983.167 2.72c.14.758.405 1.403.93 1.928c.601.602 1.36.86 2.26.982c.866.116 1.969.116 3.336.116h1.11c1.368 0 2.47 0 3.337-.116c.9-.122 1.658-.38 2.26-.982s.86-1.36.982-2.26c.116-.867.116-1.97.116-3.337v-8.11c0-1.367 0-2.47-.116-3.337c-.121-.9-.38-1.658-.982-2.26s-1.36-.86-2.26-.981c-.867-.117-1.97-.117-3.337-.117z"></path>
      <path fill="currentColor" d="M2.001 11.249a.75.75 0 0 0 0 1.5h11.973l-1.961 1.68a.75.75 0 1 0 .976 1.14l3.5-3a.75.75 0 0 0 0-1.14l-3.5-3a.75.75 0 0 0-.976 1.14l1.96 1.68z"></path>
    </svg>
  );
}

/**
 * UserMenuInner — the avatar + account menu. Requires Nostr + login context
 * (mounted via `UserMenu` -> `NostrIsland`). On first visit it auto-creates a
 * guest identity so every visitor has one; users can optionally sign in with
 * their own key via a NIP-07 browser extension (Flamingo recommended) to
 * replace it. nsec paste is intentionally not offered — it would sit in
 * plaintext localStorage (see docs/NOSTR-EVENTS.md §3.4).
 */
function UserMenuInner() {
  const { logins } = useNostrLogin();
  const actions = useLoginActions();
  const user = useCurrentUser();

  // NIP-07 browser extension present? When absent, link to getnostrame.com.
  const { available: hasExtension } = useNip07ExtensionState();

  const npub = useMemo(
    () => (user ? nip19.npubEncode(user.pubkey) : ''),
    [user],
  );
  const { name: profileName, content: profileContent } = useProfileName(user);

  const isGuest = logins[0]?.type === 'nsec';
  const identityReady = !!user;
  const triggerLabel = profileName || `…${npub.slice(-6)}`;

  const [diceRolling, setDiceRolling] = useState(false);
  const handleDiceRollEnd = useCallback(() => setDiceRolling(false), []);

  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const nameEditorRef = useRef<HTMLDivElement>(null);

  const resetNameEditor = useCallback(() => {
    const el = nameEditorRef.current;
    if (el) gsap.killTweensOf(el);
    setNameEditorOpen(false);
    if (el) gsap.set(el, { height: 0, opacity: 0 });
  }, []);

  const openNameEditor = useCallback(() => {
    setNameEditorOpen(true);
  }, []);

  useEffect(() => {
    const el = nameEditorRef.current;
    if (!el || !nameEditorOpen) return;

    gsap.killTweensOf(el);
    gsap.set(el, { height: 'auto', opacity: 0 });
    const targetHeight = el.offsetHeight;
    gsap.set(el, { height: 0, opacity: 0 });
    gsap.to(el, {
      height: targetHeight,
      opacity: 1,
      duration: 0.28,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(el, { height: 'auto' });
      },
    });
  }, [nameEditorOpen]);

  const closeNameEditor = useCallback(() => {
    const el = nameEditorRef.current;
    if (!el) {
      setNameEditorOpen(false);
      return Promise.resolve();
    }
    gsap.killTweensOf(el);
    return new Promise<void>((resolve) => {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          setNameEditorOpen(false);
          resolve();
        },
      });
    });
  }, []);

  const [copyNpub, copiedNpub] = useCopyToClipboard<string>();

  const identityNameLabel = profileName ?? 'No name set';
  const identityValue = shortNpub(npub);

  return (
    <Menu.Root onOpenChange={(open) => { if (!open) resetNameEditor(); }}>
      <Menu.Trigger
        render={
          <button
            type="button"
            aria-label={identityReady ? 'Open account menu' : 'Loading account'}
            aria-busy={!identityReady}
            className="inline-flex h-10 items-center gap-2 text-fg"
          >
            {identityReady ? (
              <>
                <span className="xds-material-medium xnn-meta hidden max-w-20 truncate rounded-[16px] corner-squircle px-2 py-1.5 text-fg sm:block">{triggerLabel}</span>
                <AlienAvatar
                  seed={npub}
                  size={26}
                  className="rounded-full"
                />
              </>
            ) : (
              <UserMenuTriggerSkeleton />
            )}
          </button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="xds-material-modal w-[22rem] rounded-[28px] corner-squircle p-4">
            <div className="space-y-4">
              <div className="xds-material-medium rounded-[24px] corner-squircle bg-surface-2/70 p-4">
                <div className="flex items-center gap-3">
                  {identityReady ? (
                    <AlienAvatar seed={npub} size={44} className="rounded-full" />
                  ) : (
                    <span aria-hidden="true" className="xnn-skeleton-shimmer h-11 w-11 rounded-full" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className={`truncate text-[var(--text-body-sm)] font-medium ${profileName ? 'text-fg' : 'text-fg-muted'}`}>
                        {identityReady ? identityNameLabel : 'No name set'}
                      </span>
                      {identityReady && (
                        <button
                          type="button"
                          aria-label="Edit name"
                          aria-expanded={nameEditorOpen}
                          disabled={nameEditorOpen}
                          onClick={openNameEditor}
                          className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-fg-muted transition-colors hover:text-fg cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                        >
                          <EditNameIcon />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={copiedNpub === npub ? 'Copied' : 'Copy npub'}
                      onClick={() => { if (identityReady) void copyNpub(npub); }}
                      disabled={!identityReady}
                      className="mt-1 block max-w-full cursor-pointer truncate font-mono text-[var(--text-meta)] text-fg transition-colors hover:text-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-60"
                    >
                      {identityReady
                        ? (copiedNpub === npub ? 'Copied' : identityValue)
                        : 'Generating…'}
                    </button>
                  </div>
                  {identityReady && isGuest && (
                    <button
                      type="button"
                      aria-label="Generate a new guest"
                      onClick={() => {
                        setDiceRolling(true);
                        actions.signOut();
                      }}
                      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[20px] corner-squircle bg-accent text-on-accent transition-transform hover:scale-110 active:scale-95"
                    >
                      <DiceIcon rolling={diceRolling} onRollEnd={handleDiceRollEnd} />
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={nameEditorRef}
                className="overflow-hidden"
                style={{ height: 0, opacity: 0 }}
                aria-hidden={!nameEditorOpen}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              >
                {/* Remount on open so autofocus fires after the panel is visible. */}
                {nameEditorOpen && (
                  <DisplayNameEditor
                    key={`name-editor-${nameEditorOpen}`}
                    currentName={profileName}
                    content={profileContent}
                    onSaved={() => void closeNameEditor()}
                    onCancel={() => void closeNameEditor()}
                    autofocus
                    inputClassName="min-w-0 flex-1 rounded-[20px] corner-squircle border border-line bg-canvas px-4 py-2.5 text-[var(--text-body-sm)] text-fg outline-none transition-colors placeholder:text-fg-muted focus:border-accent"
                  />
                )}
              </div>

              {identityReady && isGuest && !hasExtension && (
                <p className="px-1 text-center xnn-meta text-fg-muted">
                  For a permanent id, use a{' '}
                  <a
                    href="https://getnostrame.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent"
                  >
                    Nostr extension
                  </a>
                  .
                </p>
              )}

              {identityReady && isGuest && hasExtension && (
                <div className="flex justify-center py-1">
                  <LoginWithNostrButton onClick={() => void actions.loginExtension()} />
                </div>
              )}

              {identityReady && !isGuest && (
                <Menu.Item
                  onClick={actions.signOut}
                  className="flex w-full items-center gap-2 rounded-[20px] corner-squircle px-4 py-3 text-left text-[var(--text-body-sm)] text-[var(--color-red-600)] transition-colors hover:bg-surface-2"
                >
                  <SignOutIcon />
                  <span>Sign out</span>
                </Menu.Item>
              )}
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * UserMenu — the right header control. An alien avatar (deterministic from the
 * user's pubkey) that opens an account menu. The site auto-creates a guest
 * identity on first visit; signing in is optional. Replaces the old search
 * button (search is deferred to a later phase).
 */
export function UserMenu() {
  return (
    <NostrIsland>
      <UserMenuInner />
    </NostrIsland>
  );
}
