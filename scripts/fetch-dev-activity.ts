import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DevActivityCommit, DevActivityItem } from '../src/lib/activity/dev-activity.ts';

/**
 * fetch-dev-activity — polls the GitHub Events API for configured dev sources
 * and writes a static `dev-activity.json` the DevActivityRail island consumes.
 *
 * Design (see docs/DEV-ACTIVITY.md, option S1): a stateless poller run by a
 * systemd timer. No server, no DB. Per-source error isolation — one failing
 * source doesn't blank the output. Atomic write so the file is never half-made.
 *
 * Config is read from `src/config/dev-activity-sources.json` by default (the
 * same file DevActivityRail's "Missing activity?" link points at — one source
 * of truth, PR-able). The file contains both `sources` and an `exclude`
 * list of actor logins whose events should be dropped. Override sources inline
 * with the DEV_ACTIVITY_SOURCES env var for quick one-offs. feeds.ts is not
 * imported directly because it depends on Astro's import.meta.env, which is
 * undefined under plain tsx/Node.
 *
 * Usage:
 *   npx tsx scripts/fetch-dev-activity.ts
 *   GITHUB_TOKEN="$(gh auth token)" npx tsx scripts/fetch-dev-activity.ts
 *   DEV_ACTIVITY_SOURCES=org/zenon-network,user/0x3639 npx tsx scripts/fetch-dev-activity.ts
 */

interface Source {
  type: 'org' | 'user';
  name: string;
}

interface DevActivityConfig {
  sources: Source[];
  exclude: string[];
}

interface GithubActor {
  login: string;
  avatar_url?: string;
}

interface GithubRepo {
  name: string;
}

interface GithubPR {
  number: number;
  title?: string;
  html_url?: string;
  merged?: boolean;
}

interface GithubRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
}

interface GithubIssue {
  number: number;
  title?: string;
  html_url?: string;
}

interface GithubCommit {
  sha?: string;
  message?: string;
  url?: string;
}

interface GithubEventBase {
  id: string;
  actor: GithubActor;
  repo: GithubRepo;
  created_at: string;
}

/**
 * Shape of one entry from GitHub's `/events` API. `payload` carries kind-
 * specific fields; the switch in `toItem` reads them via optional chaining.
 * `[key: string]: unknown` admits whatever else the API returns without
 * forcing an `any`.
 */
interface GithubEvent extends GithubEventBase {
  type: string;
  payload: {
    size?: number;
    commits?: GithubCommit[];
    ref?: unknown;
    before?: unknown;
    head?: unknown;
    action?: string;
    pull_request?: GithubPR;
    release?: GithubRelease;
    issue?: GithubIssue;
    [key: string]: unknown;
  };
}

interface AggregatedPushItem extends Omit<DevActivityItem, 'branch'> {
  type: 'push' | 'merge';
  branch: string | null;
  latestMs: number;
  commitCount: number;
}

const INCLUDED_PR_ACTIONS = new Set(['opened', 'reopened', 'closed', 'review_requested']);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = path.resolve(SCRIPT_DIR, '../public/dev-activity.json');
const DEFAULT_SOURCES_FILE = path.resolve(SCRIPT_DIR, '../src/config/dev-activity-sources.json');
const SUMMARY_MAX = 140;
const PUSH_GROUP_WINDOW_MS = 4 * 60 * 60 * 1000;

function parseSources(input: string | undefined): Source[] {
  const raw = (input ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length === 0) return [{ type: 'org', name: 'zenon-network' }];
  return raw.map((entry) => {
    const [prefix, name] = entry.includes('/')
      ? entry.split('/', 2)
      : ['org', entry];
    return { type: prefix === 'user' ? 'user' : 'org', name: (name ?? prefix).trim() };
  });
}

function truncate(s: string, max = SUMMARY_MAX):string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function branchFromRef(ref: unknown): string | null {
  if (typeof ref !== 'string' || ref.length === 0) return null;
  if (ref.startsWith('refs/heads/')) return ref.slice('refs/heads/'.length);
  return ref;
}

function firstLine(message: string): string {
  return message.split('\n', 1)[0].trim();
}

// Branch lives on its own row in the rail (next to the repo), so it's
// deliberately omitted from these summaries — keeps grouped pushes compact.
function singlePushSummary(message: string | undefined): string {
  if (message) return truncate(firstLine(message));
  return truncate('Pushed a commit');
}

function groupedPushSummary(commitCount: number): string {
  return truncate(`Pushed ${commitCount} commits`);
}

function isMergeMessage(message: string | undefined): boolean {
  if (!message) return false;
  return firstLine(message).toLowerCase().startsWith('merge ');
}

function appendDetail(existing: string | undefined, next: string | undefined): string | undefined {
  if (!next) return existing;
  if (!existing) return next;

  const lines = new Set(existing.split('\n').filter(Boolean));
  lines.add(next);
  return Array.from(lines).join('\n');
}

function toDevActivityCommit(commit: GithubCommit | undefined): DevActivityCommit | null {
  if (!commit?.sha || !commit.message || !commit.url) return null;
  return {
    sha: commit.sha,
    message: firstLine(commit.message),
    url: commit.url,
  };
}

function dedupeCommits(commits: DevActivityCommit[]): DevActivityCommit[] {
  const seen = new Set<string>();
  const result: DevActivityCommit[] = [];
  for (const commit of commits) {
    if (seen.has(commit.sha)) continue;
    seen.add(commit.sha);
    result.push(commit);
  }
  return result;
}

/** Map a raw GitHub event into the rail's item shape, or null if it's noise. */
function toItem(ev: GithubEvent): DevActivityItem | null {
  const base = {
    id: ev.id,
    repo: ev.repo.name,
    actor: ev.actor.login,
    actorAvatar: ev.actor.avatar_url,
    createdAt: ev.created_at,
  };
  const repoUrl = `https://github.com/${ev.repo.name}`;

  switch (ev.type) {
    case 'PushEvent': {
      const branch = branchFromRef(ev.payload.ref);
      const message = ev.payload.commits?.[0]?.message;
      return {
        ...base,
        type: isMergeMessage(message) ? 'merge' : 'push',
        summary: singlePushSummary(message),
        url: branch ? `${repoUrl}/commits/${branch}` : `${repoUrl}/commits`,
        ...(branch ? { branch } : {}),
      };
    }
    case 'PullRequestEvent': {
      const rawAction = ev.payload.action ?? 'updated';
      if (!INCLUDED_PR_ACTIONS.has(rawAction)) return null;

      // The Events API abbreviates pull_request to {base,head,id,number,url} —
      // no title or html_url. Build the URL from repo+number (stable pattern)
      // and omit the title rather than leave a trailing colon. If you want rich
      // PR titles, gate a follow-up fetch to payload.pull_request.url behind a
      // GITHUB_TOKEN (unauthenticated budget can't afford N extra calls/poll).
      const pr = ev.payload.pull_request;
      if (!pr) return null;
      const isMergedPr = rawAction === 'closed' && pr.merged === true;
      const action = isMergedPr ? 'Merged' : capitalize(rawAction);
      const title = pr.title?.trim() ?? '';
      return {
        ...base,
        type: isMergedPr ? 'merge' : 'pr',
        summary: truncate(title ? `${action} PR #${pr.number}: ${title}` : `${action} PR #${pr.number}`),
        url: pr.html_url ?? `${repoUrl}/pull/${pr.number}`,
      };
    }
    case 'ReleaseEvent': {
      const rel = ev.payload.release;
      if (!rel) return null;
      const tag = rel.tag_name ?? rel.name ?? '';
      return {
        ...base,
        type: 'release',
        summary: truncate(`${capitalize(ev.payload.action ?? 'published')} release ${tag}`),
        url: rel.html_url ?? `${repoUrl}/releases/tag/${tag}`,
      };
    }
    case 'IssuesEvent': {
      const issue = ev.payload.issue;
      if (!issue) return null;
      const action = capitalize(ev.payload.action ?? 'opened');
      const title = issue.title?.trim() ?? '';
      return {
        ...base,
        type: 'issue',
        summary: truncate(title ? `${action} issue #${issue.number}: ${title}` : `${action} issue #${issue.number}`),
        url: issue.html_url ?? `${repoUrl}/issues/${issue.number}`,
      };
    }
    default:
      return null; // drop Watch/Fork/Create/etc. — noise for a dev-activity rail
  }
}

function toAggregatedPushItem(ev: GithubEvent): AggregatedPushItem | null {
  if (ev.type !== 'PushEvent') return null;

  const branch = branchFromRef(ev.payload.ref);
  const commitCount = Number(ev.payload.size ?? ev.payload.commits?.length ?? 1);
  const latestMs = new Date(ev.created_at).getTime();
  const repoUrl = `https://github.com/${ev.repo.name}`;

  return {
    id: ev.id,
    type: isMergeMessage(ev.payload.commits?.[0]?.message) ? 'merge' : 'push',
    repo: ev.repo.name,
    actor: ev.actor.login,
    actorAvatar: ev.actor.avatar_url,
    createdAt: ev.created_at,
    summary: commitCount > 1
      ? groupedPushSummary(commitCount)
      : singlePushSummary(ev.payload.commits?.[0]?.message),
    url: branch ? `${repoUrl}/commits/${branch}` : `${repoUrl}/commits`,
    detail: ev.payload.commits?.[0]?.message ? firstLine(ev.payload.commits[0].message) : undefined,
    commits: dedupeCommits((ev.payload.commits ?? []).map(toDevActivityCommit).filter((commit): commit is DevActivityCommit => commit !== null)),
    branch,
    latestMs,
    commitCount,
  };
}

function groupPushes(events: GithubEvent[]): DevActivityItem[] {
  const items: (DevActivityItem | AggregatedPushItem)[] = [];

  for (const ev of events) {
    const push = toAggregatedPushItem(ev);
    if (push) {
      const group = items.find(
        (item): item is AggregatedPushItem =>
          item.type === 'push'
          && 'latestMs' in item
          && item.actor === push.actor
          && item.repo === push.repo
          && item.branch === push.branch
          && item.latestMs - push.latestMs <= PUSH_GROUP_WINDOW_MS,
      );

      if (group) {
        group.commitCount += push.commitCount;
        group.latestMs = push.latestMs;
        group.type = 'push';
        group.summary = groupedPushSummary(group.commitCount);
        group.detail = appendDetail(group.detail, push.detail);
        group.commits = dedupeCommits([...(group.commits ?? []), ...(push.commits ?? [])]);
        continue;
      }

      items.push(push);
      continue;
    }

    const item = toItem(ev);
    if (item) items.push(item);
  }

  return items.map((item) => {
    if (!('latestMs' in item)) return item;

    // Keep `branch` (the rail renders it next to the repo); drop the
    // grouping-only bookkeeping fields.
    const { branch, latestMs: _latestMs, commitCount: _commitCount, ...plainItem } = item;
    return { ...plainItem, ...(branch ? { branch } : {}) } as DevActivityItem;
  });
}

async function fetchSource(source: Source, token: string | undefined): Promise<GithubEvent[]> {
  const endpoint = source.type === 'org'
    ? `https://api.github.com/orgs/${source.name}/events?per_page=30`
    : `https://api.github.com/users/${source.name}/events/public?per_page=30`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'atsocy-dev-activity',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(endpoint, { headers });
  if (res.status === 404) {
    console.warn(`warn: ${source.type} "${source.name}" not found (404) — skipping`);
    return [];
  }
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = res.headers.get('x-ratelimit-reset');
    console.error(`error: GitHub rate limit exhausted${reset ? ` (resets ${new Date(Number(reset) * 1000).toISOString()})` : ''}`);
    return [];
  }
  if (!res.ok) {
    console.error(`error: ${source.type} "${source.name}" → HTTP ${res.status}`);
    return [];
  }
  return (await res.json()) as GithubEvent[];
}

async function loadConfig(): Promise<DevActivityConfig> {
  // Inline env override wins (quick one-offs); otherwise read the PR-able
  // JSON file that is the shared source of truth with the rail.
  if (process.env.DEV_ACTIVITY_SOURCES) {
    return { sources: parseSources(process.env.DEV_ACTIVITY_SOURCES), exclude: [] };
  }

  const file = process.env.DEV_ACTIVITY_SOURCES_FILE ?? DEFAULT_SOURCES_FILE;
  const raw = JSON.parse(await readFile(file, 'utf8'));

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Expected an object in ${file}, got ${Array.isArray(raw) ? 'array' : typeof raw}`);
  }

  const { sources, exclude } = raw as { sources?: unknown; exclude?: unknown };
  if (!Array.isArray(sources)) {
    throw new Error(`Expected "sources" array in ${file}`);
  }

  const parsedSources = sources.map<Source>((entry: unknown, i: number) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Invalid source at index ${i} in ${file}: ${JSON.stringify(entry)}`);
    }
    const { type, name } = entry as { type?: unknown; name?: unknown };
    if ((type !== 'org' && type !== 'user') || typeof name !== 'string' || !name.trim()) {
      throw new Error(`Invalid source at index ${i} in ${file}: expected { "type": "org"|"user", "name": "..." }`);
    }
    return { type, name: name.trim() };
  });

  const parsedExclude = Array.isArray(exclude)
    ? exclude.map((value, i) => {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Invalid exclude at index ${i} in ${file}: expected non-empty string actor login`);
      }
      return value.trim().toLowerCase();
    })
    : [];

  return { sources: parsedSources, exclude: parsedExclude };
}

async function fetchHeadCommit(repo: string, head: string, token: string | undefined): Promise<GithubCommit | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'atsocy-dev-activity',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${head}`, { headers });
  if (!res.ok) return null;

  const data = await res.json() as { sha?: string; html_url?: string; commit?: { message?: string } };
  if (!data.sha || !data.commit?.message || !data.html_url) return null;
  return { sha: data.sha, message: data.commit.message, url: data.html_url };
}

async function fetchPushCommits(repo: string, before: string, head: string, token: string | undefined): Promise<GithubCommit[] | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'atsocy-dev-activity',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/compare/${before}...${head}`, { headers });
  if (!res.ok) return null;

  const data = await res.json() as {
    commits?: Array<{ sha?: string; html_url?: string; commit?: { message?: string } }>;
  };

  const commits: GithubCommit[] = (data.commits ?? [])
    .map((commit) => {
      if (!commit.sha || !commit.commit?.message || !commit.html_url) return null;
      return { sha: commit.sha, message: commit.commit.message, url: commit.html_url };
    })
    .filter((commit): commit is NonNullable<typeof commit> => commit !== null);

  return commits.length > 0 ? commits : null;
}

async function enrichPushEvents(events: GithubEvent[], token: string | undefined): Promise<void> {
  const missing = new Map<string, { repo: string; before?: string; head: string; size: number }>();

  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    if (ev.payload.commits?.[0]?.message) continue;
    if (typeof ev.payload.head !== 'string' || !ev.payload.head) continue;

    const key = `${ev.repo.name}:${ev.payload.head}`;
    if (!missing.has(key)) {
      missing.set(key, {
        repo: ev.repo.name,
        before: typeof ev.payload.before === 'string' ? ev.payload.before : undefined,
        head: ev.payload.head,
        size: Number(ev.payload.size ?? 1),
      });
    }
  }

  const commitsByKey = new Map<string, GithubCommit[]>();
  await Promise.all(
    Array.from(missing.entries()).map(async ([key, { repo, before, head, size }]) => {
      const commits = size > 1 && before && !/^0+$/.test(before)
        ? await fetchPushCommits(repo, before, head, token)
        : null;
      if (commits && commits.length > 0) {
        commitsByKey.set(key, commits);
        return;
      }

      const headCommit = await fetchHeadCommit(repo, head, token);
      if (headCommit) commitsByKey.set(key, [headCommit]);
    }),
  );

  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    if (ev.payload.commits?.[0]?.message) continue;
    if (typeof ev.payload.head !== 'string' || !ev.payload.head) continue;

    const commits = commitsByKey.get(`${ev.repo.name}:${ev.payload.head}`);
    if (commits) ev.payload.commits = commits;
  }
}

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('warn: GITHUB_TOKEN not set — using unauthenticated requests (60/hr/IP).');
  }
  const { sources, exclude } = await loadConfig();
  const limit = Number(process.env.DEV_ACTIVITY_LIMIT ?? 26);
  const outPath = path.resolve(process.env.DEV_ACTIVITY_OUT ?? DEFAULT_OUT);

  console.log(`Fetching ${sources.length} source(s): ${sources.map((s) => `${s.type}/${s.name}`).join(', ')}`);

  const settled = await Promise.all(
    sources.map((source) =>
      fetchSource(source, token).then((events) => ({ source, events, error: null as Error | null }))
        .catch((error: unknown) => ({ source, events: [] as GithubEvent[], error: error as Error })),
    ),
  );

  for (const { source, error } of settled) {
    if (error) console.error(`error: ${source.type}/${source.name} threw: ${error.message}`);
  }

  const seen = new Set<string>();
  const allEvents: GithubEvent[] = [];
  for (const { events: sourceEvents } of settled) {
    for (const ev of sourceEvents) {
      if (exclude.includes(ev.actor.login.toLowerCase())) continue;
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      allEvents.push(ev);
    }
  }
  
  allEvents.sort((a, b) => b.created_at.localeCompare(a.created_at));

  await enrichPushEvents(allEvents, token);

  const items = groupPushes(allEvents);
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const capped = items.slice(0, limit);

  await mkdir(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  await writeFile(tmp, `${JSON.stringify(capped, null, 2)}\n`, 'utf8');
  await rename(tmp, outPath);

  console.log(`Wrote ${capped.length} item(s) → ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
