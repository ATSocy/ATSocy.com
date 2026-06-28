/**
 * Mock Nostr events for UI authoring. Used while NOSTR_RELAYS and the author
 * whitelists are empty (see USE_MOCK_EVENTS in feeds.ts). Shapes follow the
 * Nostrify `NostrEvent` type and the NIPs the live feeds will use:
 *  - kind 1: text notes (Community rail, Pulse posts + replies)
 *  - kind 7: reactions (NIP-25 → Pulse upvotes)
 *  - kind 0: metadata (NIP-01 → author names/avatars)
 *  - kind 1068: polls (NIP-88 → Pulse polls with options, endsAt, polltype)
 *  - kind 1018: poll responses (NIP-88 → votes on polls)
 * Replies use NIP-10 positional `e` tags: [root, replyTo].
 */
import type { NostrEvent } from '@nostrify/types';
import { ATS_PUBKEY } from '~/config/feeds';
import { articleAddress } from '~/lib/nostr/events';

const NOW = Math.floor(Date.now() / 1000);
const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Deterministic fake npubs (hex). 64 hex chars each; not real keys.
const PK = {
  stark: 'aa11'.repeat(16),
  sugoi: 'bb22'.repeat(16),
  kaine: 'cc33'.repeat(16),
  zoe: 'dd44'.repeat(16),
  trap1: 'ee55'.repeat(16),
  trap2: 'ff66'.repeat(16),
};

const noteId = (n: number) => n.toString(16).padStart(64, '0');

function ev(
  kind: number,
  author: string,
  content: string,
  opts: { tags?: string[][]; created?: number; id: number },
): NostrEvent {
  const { tags = [], created = NOW, id } = opts;
  return {
    id: noteId(id),
    pubkey: author,
    kind,
    content,
    tags,
    created_at: created,
    sig: '0'.repeat(128),
  };
}

// --- Author metadata (kind 0) -------------------------------------------------
export const MOCK_METADATA: NostrEvent[] = [
  ev(0, PK.stark, JSON.stringify({ name: 'stark', picture: '', about: 'Zenon pillar' }), { id: 1001 }),
  ev(0, PK.sugoi, JSON.stringify({ name: 'Sugoi', picture: '', about: 'Zitadel Logz' }), { id: 1002 }),
  ev(0, PK.kaine, JSON.stringify({ name: 'Mr. Kaine', picture: '', about: 'Zenon elder' }), { id: 1003 }),
  ev(0, PK.zoe, JSON.stringify({ name: 'Zoe', picture: '', about: 'builder' }), { id: 1004 }),
  ev(0, PK.trap1, JSON.stringify({ name: 'alien_dev', picture: '', about: 'trapper' }), { id: 1005 }),
  ev(0, PK.trap2, JSON.stringify({ name: 'nomad', picture: '', about: 'trapper' }), { id: 1006 }),
];

// --- Community rail (kind 1) --------------------------------------------------
export const MOCK_COMMUNITY: NostrEvent[] = [
  ev(1, PK.stark, 'Mainnet node uptime at 99.98% this week. Pillars holding steady.', { created: NOW - 12 * MIN, id: 2001 }),
  ev(1, PK.sugoi, 'Syrius 0.2.0 RC looking solid — testing the Ledger flows now.', { created: NOW - 2 * HOUR, id: 2002 }),
  ev(1, PK.zoe, 'New Accelerator-Z proposal up for vote: community tooling grants.', { created: NOW - 5 * HOUR, id: 2003 }),
  ev(1, PK.kaine, 'Rome wasn’t built in a day. Neither was NoM.', { created: NOW - 9 * HOUR, id: 2004 }),
  ev(1, PK.stark, 'Forum traffic doubled this month. Good sign.', { created: NOW - DAY, id: 2005 }),
  ev(1, PK.sugoi, 'Bridge volume picked up again after the latest wallet walkthrough went out.', { created: NOW - 30 * HOUR, id: 2006 }),
  ev(1, PK.zoe, 'Drafting a cleaner onboarding flow for new contributors joining the ecosystem chats.', { created: NOW - 2 * DAY, id: 2007 }),
  ev(1, PK.kaine, 'Pillar operators are comparing notes on a tighter release checklist before the next push.', { created: NOW - 3 * DAY, id: 2008 }),
  ev(1, PK.stark, 'A concise channels index would help newcomers find the right room without bouncing between apps.', { created: NOW - 4 * DAY, id: 2009 }),
];

// --- Pulse posts (kind 1) with NIP-25 upvotes (kind 7) ------------------------
const ROOT = (id: number) => ['e', noteId(id), '', 'root'] as string[];
const REPLY_TO = (id: number) => ['e', noteId(id), '', 'reply'] as string[];
const REACTION = (target: number) => [['e', noteId(target), '', 'root'], ['p', PK.trap1]];

export const MOCK_PULSE: { posts: NostrEvent[]; reactions: NostrEvent[] } = {
  posts: [
    // Top-level post
    ev(1, PK.trap1, 'Zenon Network Quarterly Update Q4 2024 — signs of life from the sleeping giant. Worth the read.', {
      tags: [['t', 'zenon'], ['t', 'quarterly']],
      created: NOW - 30 * MIN,
      id: 3001,
    }),
    ev(1, PK.trap2, 'Brink Engineering: Toby Sharp on Hornet, an executable spec for Bitcoin consensus https://brink.dev/blog/2026/06/18/eng-call-toby-sharp-hornet/', {
      tags: [['thumb', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=320&q=80']],
      created: NOW - 75 * MIN,
      id: 3008,
    }),
    // Reply to it
    ev(1, PK.trap2, 'The merge-mining section is the bullish part for me.', {
      tags: [ROOT(3001), REPLY_TO(3001)],
      created: NOW - 22 * MIN,
      id: 3002,
    }),
    // Nested reply
    ev(1, PK.trap1, 'Agreed — and BTC treasury build-up is underrated.', {
      tags: [ROOT(3001), REPLY_TO(3002)],
      created: NOW - 18 * MIN,
      id: 3003,
    }),
    // Another top-level
    ev(1, PK.zoe, 'Proposal: lower Accelerator-Z quorum to speed up community grants. Thoughts?', {
      tags: [['t', 'accelerator-z'], ['t', 'governance']],
      created: NOW - 3 * HOUR,
      id: 3004,
    }),
    ev(1, PK.sugoi, 'Anyone bridging wZNN→ZNN today? Gas is favorable.', {
      tags: [['t', 'bridge']],
      created: NOW - 6 * HOUR,
      id: 3005,
    }),
    ev(1, PK.stark, 'Know Your Alien interview series should resume — community loved those.', {
      tags: [['t', 'community']],
      created: NOW - DAY,
      id: 3006,
    }),
    ev(1, PK.zoe, 'My Hermes setup, roast me\nhttps://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80', {
      tags: [['image', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80']],
      created: NOW - 36 * HOUR,
      id: 3009,
    }),
    ev(1, PK.trap2, 'Open call: devs interested in a Nostr→NoM bridge, DM me.', {
      tags: [['t', 'nostr'], ['t', 'dev']],
      created: NOW - 2 * DAY,
      id: 3007,
    }),
  ],
  reactions: [
    ev(7, PK.zoe, '+', { tags: REACTION(3001), created: NOW - 28 * MIN, id: 4001 }),
    ev(7, PK.stark, '+', { tags: REACTION(3001), created: NOW - 27 * MIN, id: 4002 }),
    ev(7, PK.sugoi, '+', { tags: REACTION(3001), created: NOW - 20 * MIN, id: 4003 }),
    ev(7, PK.kaine, '+', { tags: REACTION(3001), created: NOW - 15 * MIN, id: 4004 }),
    ev(7, PK.trap2, '+', { tags: REACTION(3004), created: NOW - 2 * HOUR, id: 4005 }),
    ev(7, PK.trap1, '+', { tags: REACTION(3004), created: NOW - 90 * MIN, id: 4006 }),
    ev(7, PK.zoe, '+', { tags: REACTION(3005), created: NOW - 5 * HOUR, id: 4007 }),
    ev(7, PK.stark, '+', { tags: REACTION(3006), created: NOW - 20 * HOUR, id: 4008 }),
    ev(7, PK.sugoi, '+', { tags: REACTION(3006), created: NOW - 19 * HOUR, id: 4009 }),
  ],
};

// --- Poll (kind 1068, NIP-88) ------------------------------------------------
const POLL_ID = 6001;

const mockPoll = ev(
  1068,
  PK.zoe,
  'What should the next community sprint focus on?',
  {
    tags: [
      ['option', 'opt_a', 'Nostr integrations'],
      ['option', 'opt_b', 'Mobile wallet UX'],
      ['option', 'opt_c', 'Onboarding guides'],
      ['option', 'opt_d', 'Pillar tooling'],
      ['relay', 'ws://localhost:7777'],
      ['polltype', 'singlechoice'],
      ['endsAt', String(NOW + 7 * DAY)],
    ],
    created: NOW - 2 * HOUR,
    id: POLL_ID,
  },
);

// Poll votes (kind 1018, NIP-88)
// Some votes include ['atsocy-signer', 'guest'] to simulate guest vs extension
// mix; `client` stays reserved for app identity (ATSocy).
const POLL_VOTE = (voter: string, optionId: string) => [
  ['e', noteId(POLL_ID), '', 'root'],
  ['response', optionId],
  ['p', voter],
  ['client', 'ATSocy'],
  ['atsocy-signer', 'nip07'],
];
const POLL_VOTE_GUEST = (voter: string, optionId: string) => [
  ['e', noteId(POLL_ID), '', 'root'],
  ['response', optionId],
  ['p', voter],
  ['client', 'ATSocy'],
  ['atsocy-signer', 'guest'],
];

const mockPollVotes: NostrEvent[] = [
  ev(1018, PK.trap1, '', { tags: POLL_VOTE_GUEST(PK.trap1, 'opt_a'), created: NOW - 100 * MIN, id: 6101 }),
  ev(1018, PK.trap2, '', { tags: POLL_VOTE(PK.trap2, 'opt_a'), created: NOW - 90 * MIN, id: 6102 }),
  ev(1018, PK.stark, '', { tags: POLL_VOTE_GUEST(PK.stark, 'opt_b'), created: NOW - 80 * MIN, id: 6103 }),
  ev(1018, PK.sugoi, '', { tags: POLL_VOTE(PK.sugoi, 'opt_b'), created: NOW - 70 * MIN, id: 6104 }),
  ev(1018, PK.kaine, '', { tags: POLL_VOTE_GUEST(PK.kaine, 'opt_a'), created: NOW - 60 * MIN, id: 6105 }),
  ev(1018, PK.zoe, '', { tags: POLL_VOTE(PK.zoe, 'opt_c'), created: NOW - 50 * MIN, id: 6106 }),
];

// Comments on the poll (kind 1 replies with e tag → poll event)
const mockPollComments: NostrEvent[] = [
  ev(1, PK.trap1, 'Nostr is the obvious play — it gives us censorship-resistant social on top of NoM.', {
    tags: [ROOT(POLL_ID), REPLY_TO(POLL_ID)],
    created: NOW - 95 * MIN,
    id: 6201,
  }),
  ev(1, PK.stark, 'Mobile wallet UX is holding back adoption more than anything else.', {
    tags: [ROOT(POLL_ID), REPLY_TO(POLL_ID)],
    created: NOW - 75 * MIN,
    id: 6202,
  }),
  ev(1, PK.sugoi, 'Can we do both Nostr AND wallet UX in one sprint? Asking for a friend.', {
    tags: [ROOT(POLL_ID), REPLY_TO(6201)],
    created: NOW - 60 * MIN,
    id: 6203,
  }),
  ev(1, PK.kaine, 'Results are leaning toward option A — interesting. Community sees the protocol layer as priority.', {
    tags: [ROOT(POLL_ID), REPLY_TO(POLL_ID)],
    created: NOW - 45 * MIN,
    id: 6204,
  }),
];

// Reactions on poll comments
const mockPollCommentReactions: NostrEvent[] = [
  ev(7, PK.zoe, '+', { tags: REACTION(6201), created: NOW - 90 * MIN, id: 6301 }),
  ev(7, PK.trap2, '+', { tags: REACTION(6202), created: NOW - 70 * MIN, id: 6302 }),
  ev(7, PK.trap1, '+', { tags: REACTION(6203), created: NOW - 55 * MIN, id: 6303 }),
  ev(7, PK.stark, '+', { tags: REACTION(6203), created: NOW - 50 * MIN, id: 6304 }),
];

// Extend MOCK_PULSE with poll data — poll post + comments + comment reactions
MOCK_PULSE.posts.push(
  mockPoll,
  ...mockPollComments,
);
MOCK_PULSE.reactions.push(...mockPollCommentReactions);

// Export poll votes separately so the mock store can load them (kind 1018
// is not a post or reaction — it's queried independently for poll tallies).
export const MOCK_POLL_VOTES: NostrEvent[] = mockPollVotes;

// --- Editorial articles (kind 30023) + NIP-22 comments (kind 1111) -----------
const ARTICLE_HINT = '';
const SLUG_CULTURE = 'building-culture-without-leaders';
const SLUG_Q4 = 'zenon-network-quarterly-update-q4-2024';
const ADDR_CULTURE = articleAddress(ATS_PUBKEY, SLUG_CULTURE);
const ADDR_Q4 = articleAddress(ATS_PUBKEY, SLUG_Q4);

const MOCK_ARTICLE_CULTURE = ev(
  30023,
  ATS_PUBKEY,
  'Building culture without leaders — editorial body.',
  {
    id: 5001,
    created: NOW - 5 * DAY,
    tags: [
      ['d', SLUG_CULTURE],
      ['title', 'Building Culture Without Leaders'],
      ['summary', 'The corporate world is on the brink of a revolution.'],
      ['published_at', String(NOW - 5 * DAY)],
      ['canonical_url', `https://atsocy.com/${SLUG_CULTURE}`],
      ['t', 'nostr'],
    ],
  },
);

const MOCK_ARTICLE_Q4 = ev(
  30023,
  ATS_PUBKEY,
  'Zenon Network Quarterly Update Q4 2024 — editorial body.',
  {
    id: 5002,
    created: NOW - 4 * DAY,
    tags: [
      ['d', SLUG_Q4],
      ['title', 'Zenon Network Quarterly Update Q4 2024'],
      ['summary', 'Signs of life from the sleeping giant.'],
      ['published_at', String(NOW - 4 * DAY)],
      ['canonical_url', `https://atsocy.com/${SLUG_Q4}`],
      ['t', 'zenon'],
    ],
  },
);

const MOCK_COMMENT_C1 = ev(
  1111,
  PK.trap2,
  'The merge-mining section finally clicked for me.',
  {
    id: 5101,
    created: NOW - 4 * DAY + 6 * HOUR,
    tags: [
      ['A', ADDR_CULTURE, ARTICLE_HINT], ['K', '30023'], ['P', ATS_PUBKEY, ARTICLE_HINT],
      ['a', ADDR_CULTURE, ARTICLE_HINT], ['e', noteId(5001), ARTICLE_HINT, ATS_PUBKEY],
      ['k', '30023'], ['p', ATS_PUBKEY, ARTICLE_HINT],
    ],
  },
);

const MOCK_COMMENT_C2 = ev(
  1111,
  PK.zoe,
  'Bookmarking this for the community call.',
  {
    id: 5102,
    created: NOW - 4 * DAY + 4 * HOUR,
    tags: [
      ['A', ADDR_CULTURE, ARTICLE_HINT], ['K', '30023'], ['P', ATS_PUBKEY, ARTICLE_HINT],
      ['a', ADDR_CULTURE, ARTICLE_HINT], ['e', noteId(5001), ARTICLE_HINT, ATS_PUBKEY],
      ['k', '30023'], ['p', ATS_PUBKEY, ARTICLE_HINT],
    ],
  },
);

const MOCK_COMMENT_C2A = ev(
  1111,
  PK.trap1,
  'Same — the treasury framing is underrated.',
  {
    id: 5103,
    created: NOW - 4 * DAY + 3 * HOUR,
    tags: [
      ['A', ADDR_CULTURE, ARTICLE_HINT], ['K', '30023'], ['P', ATS_PUBKEY, ARTICLE_HINT],
      ['e', noteId(5102), ARTICLE_HINT, PK.zoe],
      ['k', '1111'], ['p', PK.zoe, ARTICLE_HINT],
    ],
  },
);

const MOCK_COMMENT_Q4 = ev(
  1111,
  PK.stark,
  'Signs of life from the sleeping giant — good recap.',
  {
    id: 5104,
    created: NOW - 3 * DAY + 2 * HOUR,
    tags: [
      ['A', ADDR_Q4, ARTICLE_HINT], ['K', '30023'], ['P', ATS_PUBKEY, ARTICLE_HINT],
      ['a', ADDR_Q4, ARTICLE_HINT], ['e', noteId(5002), ARTICLE_HINT, ATS_PUBKEY],
      ['k', '30023'], ['p', ATS_PUBKEY, ARTICLE_HINT],
    ],
  },
);

export const MOCK_EDITORIAL: NostrEvent[] = [
  MOCK_ARTICLE_CULTURE,
  MOCK_ARTICLE_Q4,
  MOCK_COMMENT_C1,
  MOCK_COMMENT_C2,
  MOCK_COMMENT_C2A,
  MOCK_COMMENT_Q4,
  ev(7, PK.trap1, '+', {
    tags: [['e', noteId(5101), '', PK.trap2], ['p', PK.trap2], ['k', '1111']],
    created: NOW - 4 * DAY + 5 * HOUR,
    id: 5201,
  }),
];
