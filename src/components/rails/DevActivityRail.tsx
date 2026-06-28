import '@primer/primitives/dist/css/functional/themes/light.css';
import { useEffect, useMemo, useState } from 'react';
import {
  BaseStyles,
  ThemeProvider,
  Timeline,
} from '@primer/react';
import {
  GitBranchIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  TagIcon,
} from '@primer/octicons-react';
import { FEED_LIMITS } from '~/config/feeds';
import { formatRelativeTime } from '~/lib/nostr/events';
import type { DevActivityItem } from '~/lib/activity/dev-activity';
import { XnnCommitPopover } from '~/components/ui/XnnCommitPopover';
import { InfoIcon } from '~/components/ui/InfoIcon';

/**
 * DevActivityRail — live signal layer. Recent GitHub events (commits, PRs,
 * releases, issues) from configured Zenon dev sources.
 *
 * STATIC-FIRST CONTRACT (see docs/SITE-ARCHITECTURE.md):
 *  - First paint uses `seed` (build-provided) so the zone is never empty.
 *  - The island renders `seed` first, then refreshes from `/dev-activity.json`.
 *  - This layer is NOT crawlable canonically and is excluded from sitemap/JSON-LD.
 */
export interface DevActivityRailProps {
  seed?: DevActivityItem[];
  limit?: number;
}

// After the repo is open-sourced, this opens GitHub's editor on the source
// list file. A visitor adds their org/user and clicks "Propose changes",
// which auto-opens a PR. Merge → deploy.yml rebuilds → the VPS poller picks
// it up on its next run.
const SUGGEST_SOURCE_URL =
  'https://github.com/ATSocy/ATSocy.com/edit/main/src/config/dev-activity-sources.json';
const DEV_ACTIVITY_URL = import.meta.env.DEV ? '/dev-activity.json' : 'https://api.atsocy.com/dev-activity.json';
const EMPTY_DEV_ACTIVITY_SEED: DevActivityItem[] = [];
const MOBILE_DEV_ACTIVITY_LIMIT = 8;

function repoUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

function itemDecoration(item: DevActivityItem) {
  switch (item.type) {
    case 'push':
      return { icon: GitCommitIcon, iconClassName: 'text-fg-muted' };
    case 'merge':
      return { icon: GitMergeIcon, badgeVariant: 'done' as const, iconClassName: 'text-[#8250df]' };
    case 'pr':
      return { icon: GitPullRequestIcon, badgeVariant: 'open' as const, iconClassName: 'text-[#8250df]' };
    case 'release':
      return { icon: TagIcon, badgeVariant: 'success' as const, iconClassName: 'text-[#1a7f37]' };
    case 'issue':
      return { icon: IssueOpenedIcon, badgeVariant: 'open' as const, iconClassName: 'text-[#1a7f37]' };
    default:
      return { icon: GitCommitIcon, badgeVariant: 'accent' as const, iconClassName: 'text-[#1f6feb]' };
  }
}

function isDevActivityItem(value: unknown): value is DevActivityItem {
  if (typeof value !== 'object' || value === null) return false;

  const item = value as Record<string, unknown>;
  const commits = item.commits;
  return (
    typeof item.id === 'string'
    && typeof item.type === 'string'
    && typeof item.repo === 'string'
    && typeof item.actor === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.summary === 'string'
    && typeof item.url === 'string'
    && (item.actorAvatar === undefined || typeof item.actorAvatar === 'string')
    && (item.detail === undefined || typeof item.detail === 'string')
    && (item.branch === undefined || typeof item.branch === 'string')
    && (commits === undefined || (Array.isArray(commits) && commits.every((commit) => {
      if (typeof commit !== 'object' || commit === null) return false;
      const value = commit as Record<string, unknown>;
      return typeof value.sha === 'string' && typeof value.message === 'string' && typeof value.url === 'string';
    })))
  );
}

function parseDevActivityItems(value: unknown): DevActivityItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isDevActivityItem);
}

function hasGroupedCommits(item: DevActivityItem): boolean {
  return item.type === 'push' && (item.commits?.length ?? 0) > 1;
}

function DevActivityRailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="xnn-dev-activity-rail" data-nosnippet aria-hidden="true">
      <ThemeProvider colorMode="day">
        <BaseStyles>
          <div className="space-y-4">
            <div className="xnn-dev-activity-skeleton">
              {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={`xnn-dev-activity-skeleton__row ${index >= MOBILE_DEV_ACTIVITY_LIMIT ? 'hidden lg:grid' : ''}`}>
                  <div className="xnn-dev-activity-skeleton__rail">
                    <span className="xnn-dev-activity-skeleton__line" />
                    <span className="xnn-dev-activity-skeleton__badge xnn-skeleton-shimmer" />
                  </div>
                  <div className="xnn-dev-activity-skeleton__content">
                    <span className="xnn-dev-activity-skeleton__avatar xnn-skeleton-shimmer" />
                    <div className="xnn-dev-activity-skeleton__body">
                      <span className="xnn-dev-activity-skeleton__title xnn-skeleton-shimmer" />
                      <span className="xnn-dev-activity-skeleton__repo xnn-skeleton-shimmer" />
                    </div>
                    <span className="xnn-dev-activity-skeleton__time xnn-skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BaseStyles>
      </ThemeProvider>
    </div>
  );
}

export function DevActivityRail({ seed = EMPTY_DEV_ACTIVITY_SEED, limit = FEED_LIMITS.devActivity }: DevActivityRailProps) {
  const seedItems = useMemo(() => seed.slice(0, limit), [seed, limit]);
  const [items, setItems] = useState<DevActivityItem[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 63.999rem)');
    const sync = () => setIsMobile(media.matches);

    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Client-only refresh of the build-time JSON. react-doctor flags this as
  // "fetch in effect"; the alternative (a Server Component) isn't available
  // here — this is an Astro island hydrating against a static JSON file.
  // oxlint-disable-next-line react-doctor/no-fetch-in-effect
  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function load(attempt = 0): Promise<void> {
      try {
        const res = await fetch(DEV_ACTIVITY_URL, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = parseDevActivityItems(await res.json()).slice(0, limit);
        setItems(data);
      } catch {
        if (controller.signal.aborted) return;
        if (attempt < 3) {
          retryTimer = setTimeout(() => void load(attempt + 1), 3000 * (attempt + 1));
          return;
        }
        setItems(seedItems.length > 0 ? seedItems : []);
      }
    }

    void load();
    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [limit, seedItems]);

  const visibleLimit = isMobile ? Math.min(limit, MOBILE_DEV_ACTIVITY_LIMIT) : limit;

  if (items === null) {
    return <DevActivityRailSkeleton count={visibleLimit} />;
  }

  if (items.length === 0) {
    return (
      <p className="flex min-h-24 items-center justify-center text-center xnn-meta" data-nosnippet>No dev activity yet.</p>
    );
  }

  const visibleItems = items.slice(0, visibleLimit);

  return (
    <div className="xnn-dev-activity-rail" data-nosnippet>
      <ThemeProvider colorMode="day">
        <BaseStyles>
          <div className="space-y-4">
            <Timeline aria-label="Dev Activity timeline">
              {visibleItems.map((item) => {
                const { icon: Icon, badgeVariant, iconClassName } = itemDecoration(item);
                return (
                  <Timeline.Item key={item.id} condensed>
                    {badgeVariant ? (
                      <Timeline.Badge variant={badgeVariant}>
                        <Icon size={14} className={iconClassName} aria-label={item.type} />
                      </Timeline.Badge>
                    ) : (
                      <Timeline.Badge>
                        <Icon size={14} className={iconClassName} aria-label={item.type} />
                      </Timeline.Badge>
                    )}
                    <Timeline.Body>
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pr-4 py-2 text-fg">
                        {item.actorAvatar ? (
                          <img src={item.actorAvatar} alt="" className="-mt-1 h-5 w-5 rounded-full object-cover" loading="lazy" />
                        ) : (
                          <span className="-mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[0.625rem] font-semibold text-fg">
                            {item.actor.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          {hasGroupedCommits(item)
                            ? (
                               <XnnCommitPopover
                                commits={item.commits ?? []}
                                actor={item.actor}
                                actorAvatar={item.actorAvatar}
                                trigger={(
                                  <span className="inline-flex items-center gap-1 cursor-pointer text-body text-fg! no-underline [text-decoration:none] hover:text-fg! hover:no-underline hover:[text-decoration:none]">
                                    <span className="block truncate">{item.summary}</span>
                                    <span className="inline-flex h-3 w-3 mt-1 shrink-0 items-center justify-center text-fg-muted transition-colors">
                                      <InfoIcon size={13} />
                                    </span>
                                  </span>
                                )}
                              />
                            )
                            : (
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block truncate text-body text-fg! no-underline [text-decoration:none] hover:text-fg! hover:no-underline hover:[text-decoration:none]" title={item.detail && item.detail !== item.summary ? item.detail : undefined}>
                                {item.summary}
                              </a>
                            )}
                          <div className="mt-1 flex min-w-0 items-center gap-1.5 xnn-meta">
                            <a href={repoUrl(item.repo)} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-fg-subtle! no-underline [text-decoration:none] hover:text-fg-muted! hover:no-underline hover:[text-decoration:none]">
                              {item.repo}
                            </a>
                            {item.branch ? (
                              <span className="inline-flex max-w-[40%] shrink-0 items-center gap-0.5 text-fg-subtle" title={`Branch ${item.branch}`}>
                                <GitBranchIcon size={11} className="shrink-0" aria-hidden="true" />
                                <span className="truncate">{item.branch}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <span className="xnn-meta whitespace-nowrap">{formatRelativeTime(Math.floor(new Date(item.createdAt).getTime() / 1000))}</span>
                      </div>
                    </Timeline.Body>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            <div className="pt-2 text-center">
                <a
                  href={SUGGEST_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="xnn-meta block text-fg-muted! no-underline [text-decoration:none] transition-colors hover:text-accent! hover:no-underline hover:[text-decoration:none]"
                  style={{ textDecoration: 'none' }}
                  aria-label="Missing activity? Suggest a repository to track by editing the source list on GitHub"
                >
                Missing activity? Suggest a repository to track
              </a>
            </div>
          </div>
        </BaseStyles>
      </ThemeProvider>
    </div>
  );
}
