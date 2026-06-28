export interface DevActivityCommit {
  sha: string;
  message: string;
  url: string;
}

/**
 * DevActivityItem — the shape of an entry in `/dev-activity.json`, produced by
 * `scripts/fetch-dev-activity.ts` and consumed by `DevActivityRail`. Lives here
 * (not in either file) so the producer and consumer share one source of truth
 * instead of "keep in sync" duplicate definitions.
 */
export interface DevActivityItem {
  id: string;
  type: 'push' | 'merge' | 'pr' | 'release' | 'issue' | 'other';
  repo: string;
  actor: string;
  actorAvatar?: string;
  createdAt: string; // ISO
  summary: string;
  url: string;
  detail?: string;
  commits?: DevActivityCommit[];
  branch?: string;
}
