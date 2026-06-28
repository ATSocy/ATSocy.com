import { Popover } from '@base-ui/react/popover';
import { ScrollArea } from '@base-ui/react/scroll-area';
import type { ReactElement, ReactNode } from 'react';
import '@primer/primitives/dist/css/functional/themes/light.css';
import { BaseStyles, ThemeProvider, Timeline } from '@primer/react';
import { GitCommitIcon } from '@primer/octicons-react';
import type { DevActivityCommit } from '~/lib/activity/dev-activity';

const SUMMARY_LINK = 'block truncate text-body !text-fg no-underline [text-decoration:none] hover:!text-fg hover:no-underline hover:[text-decoration:none]';
const MAX_VISIBLE_COMMITS = 3;

function CommitTimelineRow({
  commit,
  actor,
  actorAvatar,
}: {
  commit: DevActivityCommit;
  actor: string;
  actorAvatar?: string;
}): ReactElement {
  return (
    <Timeline.Item condensed>
      <Timeline.Badge>
        <GitCommitIcon size={14} className="text-fg-muted" aria-label="commit" />
      </Timeline.Badge>
      <Timeline.Body>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pr-4 py-2 text-fg">
          {actorAvatar ? (
            <img src={actorAvatar} alt="" className="-mt-1 h-5 w-5 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="-mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[0.625rem] font-semibold text-fg">
              {actor.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={SUMMARY_LINK}
            >
              {commit.message}
            </a>
            <span className="mt-1 block xnn-meta !text-fg-subtle">{commit.sha.slice(0, 7)}</span>
          </div>
        </div>
      </Timeline.Body>
    </Timeline.Item>
  );
}

export function XnnCommitPopover({
  trigger,
  commits,
  actor,
  actorAvatar,
}: {
  trigger: ReactNode;
  commits: DevActivityCommit[];
  actor: string;
  actorAvatar?: string;
}): ReactElement {
  return (
    <Popover.Root>
      <Popover.Trigger className="w-full text-left outline-none">{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="z-50" sideOffset={8} align="start">
          <Popover.Popup className="xds-material-modal corner-squircle w-[min(28rem,calc(100vw-2rem))] rounded-[24px] p-4 outline-none">
            <ThemeProvider colorMode="day">
              <BaseStyles>
                <ScrollArea.Root className="xnn-dev-activity-rail relative mt-1 overflow-hidden" data-scrollable={commits.length > MAX_VISIBLE_COMMITS || undefined}>
                  <ScrollArea.Viewport className={commits.length > MAX_VISIBLE_COMMITS ? 'h-[12.75rem] w-full' : 'w-full'}>
                    <Timeline aria-label="Grouped commits">
                      {commits.map((commit) => (
                        <CommitTimelineRow
                          key={commit.sha}
                          commit={commit}
                          actor={actor}
                          actorAvatar={actorAvatar}
                        />
                      ))}
                    </Timeline>
                  </ScrollArea.Viewport>
                  {commits.length > MAX_VISIBLE_COMMITS ? (
                    <>
                      <ScrollArea.Scrollbar
                        orientation="vertical"
                        className="flex w-2 touch-none p-px"
                      >
                        <ScrollArea.Thumb className="flex-1 rounded-full bg-line-strong" />
                      </ScrollArea.Scrollbar>
                      <ScrollArea.Corner />
                    </>
                  ) : null}
                </ScrollArea.Root>
              </BaseStyles>
            </ThemeProvider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
