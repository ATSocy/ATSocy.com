import type { SVGProps } from 'react';

export interface ChannelsRailProps {
  limit?: number;
}

const CHANNELS = [
  { key: 'telegram', label: 'Telegram' },
  { key: 'matrix', label: 'Matrix' },
  { key: 'discord', label: 'Discord' },
  { key: 'x', label: 'X' },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];

const SKELETON_LINE_SETS = [
  ['w-[88%]', 'w-[72%]'],
  ['w-[94%]', 'w-[78%]', 'w-[61%]'],
  ['w-[82%]', 'w-[90%]', 'w-[67%]', 'w-[54%]'],
  ['w-[91%]', 'w-[69%]'],
] as const;

const CHANNELS_COMING_SOON_HREF = '/channels';
const SKELETON_COUNT = 14;
const MAX_VISIBLE_SOURCE_ICONS = 5;
const MOBILE_LIMIT = 6;

function ChannelDivider({ index }: { index: number }) {
  const variant = index % 3;
  const strokePath = variant === 1
    ? 'M0 8 H452 L460 12 H540 L548 8 H1000'
    : variant === 2
      ? 'M0 8 H280 L295 12 H365 L380 8 H620 L635 4 H705 L720 8 H1000'
      : 'M0 8 H430 L445 12 H555 L570 8 H1000';

  return (
    // oxlint-disable-next-line react-doctor/prefer-tag-over-role
    <div className={`xnn-divider xnn-divider--horizontal ${variant === 1 ? 'xnn-divider--dots' : variant === 2 ? 'xnn-divider--stripes' : 'xnn-divider--shelf'}`} role="separator" aria-orientation="horizontal">
      <svg className="xnn-divider__notch" viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
        <path className="xnn-divider__stroke" d={strokePath} />
        {variant === 0 && <path className="xnn-divider__accent" d="M485 14 H515" />}
        {variant === 1 && (
          <>
            <path className="xnn-divider__mark xnn-divider__dot" d="M492 9.5 h0.01" />
            <path className="xnn-divider__mark xnn-divider__dot" d="M500 9.5 h0.01" />
            <path className="xnn-divider__mark xnn-divider__dot" d="M508 9.5 h0.01" />
          </>
        )}
      </svg>
    </div>
  );
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M470.435 45.423L16.827 221.249c-18.254 8.188-24.428 24.585-4.412 33.484l116.37 37.173l281.368-174.79c15.363-10.973 31.091-8.047 17.557 4.024L186.053 341.075l-7.591 93.076c7.031 14.371 19.905 14.438 28.117 7.295l66.858-63.589l114.505 86.187c26.595 15.826 41.066 5.613 46.788-23.394l75.105-357.47c7.798-35.705-5.5-51.437-39.4-37.757"></path>
    </svg>
  );
}

function MatrixIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M46 46v164h18a6 6 0 0 1 0 12H40a6 6 0 0 1-6-6V40a6 6 0 0 1 6-6h24a6 6 0 0 1 0 12Zm170-12h-24a6 6 0 0 0 0 12h18v164h-18a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6V40a6 6 0 0 0-6-6m-64 56a30 30 0 0 0-24 12a30 30 0 0 0-42-6a6 6 0 0 0-12 0v64a6 6 0 0 0 12 0v-40a18 18 0 0 1 36 0v40a6 6 0 0 0 12 0v-40a18 18 0 0 1 36 0v40a6 6 0 0 0 12 0v-40a30 30 0 0 0-30-30"></path>
    </svg>
  );
}

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 199" aria-hidden="true" {...props}>
      <path fill="#5865f2" d="M216.856 16.597A208.5 208.5 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046q-29.538-4.442-58.533 0c-1.832-4.4-4.55-9.933-6.846-14.046a207.8 207.8 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161 161 0 0 0 79.735 175.3a136.4 136.4 0 0 1-21.846-10.632a109 109 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a132 132 0 0 0 5.355 4.237a136 136 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848c21.142-6.58 42.646-16.637 64.815-33.213c5.316-56.288-9.08-105.09-38.056-148.36M85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2s23.236 11.804 23.015 26.2c.02 14.375-10.148 26.18-23.015 26.18m85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2c0 14.375-10.148 26.18-23.015 26.18"></path>
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M75.916 54.2L122.542 0h-11.05L71.008 47.06L38.672 0H1.376l48.898 71.164L1.376 128h11.05L55.18 78.303L89.328 128h37.296L75.913 54.2ZM60.782 71.79l-4.955-7.086l-39.42-56.386h16.972L65.19 53.824l4.954 7.086l41.353 59.15h-16.97L60.782 71.793Z"></path>
    </svg>
  );
}

function channelIcon(key: ChannelKey) {
  const cls = 'shrink-0';
  switch (key) {
    case 'telegram': return <TelegramIcon className={`${cls} h-4 w-4 text-[#229ED9]`} />;
    case 'matrix':   return <MatrixIcon   className={`${cls} text-fg h-5 w-5`} />;
    case 'discord':  return <DiscordIcon  className={`${cls} h-4 w-[1.29rem]`} />;
    case 'x':        return <XIcon        className={`${cls} text-fg h-3 w-3`} />;
  }
}

function channelForNote(index: number): ChannelKey {
  return CHANNELS[index % CHANNELS.length].key;
}

function sourcesForNote(index: number, primary: ChannelKey): ChannelKey[] {
  if (primary === 'matrix'   && index % 8 === 1) return Array(5).fill(primary) as ChannelKey[];
  if (primary === 'telegram' && index % 8 === 0) return Array(7).fill(primary) as ChannelKey[];
  if (primary === 'x'        && index % 8 === 3) return Array(6).fill(primary) as ChannelKey[];
  if (index % 4 === 0) return Array(5).fill(primary) as ChannelKey[];
  if (index % 3 === 0) return Array(3).fill(primary) as ChannelKey[];
  return [primary];
}

function ChannelCopySkeleton({ index }: { index: number }) {
  const widths = SKELETON_LINE_SETS[index % SKELETON_LINE_SETS.length];
  return (
    <span className="flex min-w-0 w-full flex-col gap-2">
      {widths.map((width, i) => (
        <span key={`${index}-${i}`} className={`xnn-skeleton-shimmer block h-[0.95rem] rounded-full ${width}`} />
      ))}
    </span>
  );
}

export function ChannelsRail({ limit = SKELETON_COUNT }: ChannelsRailProps) {
  const count = Math.min(limit, SKELETON_COUNT);
  return (
    <div data-nosnippet>
      <ol>
        {Array.from({ length: count }, (_, index) => {
          const channel = channelForNote(index);
          const sources = sourcesForNote(index, channel);
          return (
            <li key={index} className={index >= MOBILE_LIMIT ? 'hidden lg:block' : undefined}>
              {index > 0 && <ChannelDivider index={index} />}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-5">
                <div className="min-w-0">
                  <a href={CHANNELS_COMING_SOON_HREF} className="group block no-underline hover:text-fg">
                    <div className="xnn-copy">
                      <ChannelCopySkeleton index={index} />
                    </div>
                  </a>
                  <a
                    href={CHANNELS_COMING_SOON_HREF}
                    className="mt-2 inline-flex items-center gap-1 rounded-[16px] corner-squircle border border-transparent bg-transparent px-2 py-0.5 align-middle whitespace-nowrap no-underline transition-colors hover:border-line hover:bg-surface-2"
                  >
                    {sources.slice(0, MAX_VISIBLE_SOURCE_ICONS).map((source, i) => (
                      <span key={`${index}-${source}-${i}`} className="inline-flex h-5 w-5 items-center justify-center align-middle">
                        {channelIcon(source)}
                      </span>
                    ))}
                    {sources.length > MAX_VISIBLE_SOURCE_ICONS && (
                      <span className="xnn-meta inline-flex items-center gap-1 align-middle">
                        <span>+{sources.length - MAX_VISIBLE_SOURCE_ICONS}</span>
                        <span>sources</span>
                      </span>
                    )}
                  </a>
                </div>
                <a href={CHANNELS_COMING_SOON_HREF} className="group mt-1 block no-underline">
                  <span className="xnn-skeleton-shimmer block h-3 w-8 rounded-full whitespace-nowrap" />
                </a>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="pt-3 text-center lg:hidden">
        <a href={CHANNELS_COMING_SOON_HREF} className="xnn-meta text-accent no-underline hover:underline">
          View all
        </a>
      </div>
      <div className="mt-2 lg:hidden">
        <div className="xnn-divider xnn-divider--horizontal xnn-divider--shelf" role="separator" aria-orientation="horizontal">
          <svg className="xnn-divider__notch" viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
            <path className="xnn-divider__stroke" d="M0 8 H430 L445 12 H555 L570 8 H1000" />
            <path className="xnn-divider__accent" d="M485 14 H515" />
          </svg>
        </div>
      </div>
    </div>
  );
}
