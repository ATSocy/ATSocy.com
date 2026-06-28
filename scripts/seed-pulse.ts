/**
 * Seeds the local atsrfry relay with signed events covering every Pulse UI
 * state documented in docs/NOSTR-EVENTS.md:
 *
 *   Profiles (kind 0):  full / minimal / partial / none (truncated-npub render)
 *   Pulse posts (1):    text w/ title+tags, link w/ imeta, image, plain, short
 *   Votes (kind 7):     up(+), down(-), empty-as-up(""), emoji(ignored), dedupe,
 *                       self-vote, vote-on-comment
 *   Comments (1+NIP-10):nested tree — 2 branches, 3 levels deep
 *   Article (30023):    one NIP-23 article (target for article comments)
 *   Article comments:   NIP-22 kind 1111, top-level + nested
 *
 * Deterministic: fixed dev keys + fixed created_at offsets ⇒ identical event
 * ids on every run, so the relay dedupes and re-runs are idempotent.
 *
 *   Usage: tsx scripts/seed-pulse.ts [ws://127.0.0.1:7777]
 *
 * The keys below are publicly-known throwaways — LOCAL DEV ONLY, never prod.
 */
import { finalizeEvent, getPublicKey, SimplePool, type VerifiedEvent } from 'nostr-tools';

const RELAYS = (process.argv[2] ?? 'ws://127.0.0.1:7777').split(',').map((r) => r.trim());
const HINT = RELAYS[0]; // relay hint embedded in e/a tags (NIP-10/22/25)

// Fixed base so event ids are stable across re-runs (≈ 2026-06). Bump to
// re-anchor the relative-time display; existing seeded events stay (relay
// keeps them) unless you wipe .local/atsrfry-db/.
const BASE = 1_781_500_000;
const min = 60, hr = 60 * min, day = 24 * hr;
const ago = (s: number) => BASE - s;

// --- throwaway dev keypairs (32-byte hex; valid secp256k1 scalars) -----------
const hex = (h: string) => {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const SK = {
  alice: hex('11'.repeat(32)),
  bob: hex('22'.repeat(32)),
  carol: hex('33'.repeat(32)),
  dave: hex('44'.repeat(32)),
  eve: hex('55'.repeat(32)),
} as const;
type Author = keyof typeof SK;
const PK: Record<Author, string> = Object.fromEntries(
  (Object.entries(SK) as [Author, Uint8Array][]).map(([k, v]) => [k, getPublicKey(v)]),
) as Record<Author, string>;

const events: VerifiedEvent[] = []; // accumulate signed events

/** Build + sign a template, push to the set. Returns the signed event. */
function ev(
  author: Author,
  kind: number,
  content: string,
  tags: string[][],
  created: number,
): VerifiedEvent {
  return finalizeEvent({ kind, content, tags, created_at: created }, SK[author]);
}

// ── Profiles (kind 0) — full / minimal / partial / none ─────────────────────
// Use realistic, plain profile metadata — no fake ATSocy branding / nip05.
// These created_at values intentionally win over older seeded metadata.
const META = (o: object) => JSON.stringify(o);
events.push(ev('alice', 0, META({ name: 'alice', display_name: 'alice', picture: 'https://api.dicebear.com/7.x/thumbs/svg?seed=alice', about: 'nostr + zenon' }), [], ago(10 * min)));
events.push(ev('bob', 0, META({ name: 'bob' }), [], ago(10 * min))); // minimal
events.push(ev('carol', 0, META({ name: 'carol', display_name: 'carol' }), [], ago(10 * min))); // no picture
events.push(ev('dave', 0, META({ name: 'dave', picture: 'https://api.dicebear.com/7.x/thumbs/svg?seed=dave' }), [], ago(10 * min))); // no about
// eve: intentionally NO kind 0 → renders as truncated npub

// ── Pulse posts (kind 1) ────────────────────────────────────────────────────
const P1 = ev('alice', 1,
  'Proposal: lower Accelerator-Z quorum to speed up community grants\n\nQuorum hasn\'t been an issue lately and engagement is up. Thoughts?',
  [['t', 'accelerator-z'], ['t', 'governance'], ['title', 'Proposal: lower Accelerator-Z quorum to speed up community grants']],
  ago(2 * hr));
const P2 = ev('bob', 1,
  'Brink Engineering: Toby Sharp on Hornet, an executable spec for Bitcoin consensus\nhttps://brink.dev/blog/2026/06/18/eng-call-toby-sharp-hornet/',
  [['title', 'Brink Engineering: Toby Sharp on Hornet'],
   ['imeta', 'url https://brink.dev/og/hornet.png', 'm image/png', 'dim 1200x630']],
  ago(5 * hr));
const P3 = ev('carol', 1,
  'Hot take: the forum UI needs a dark mode before anything else.',
  [], ago(8 * hr));
const P4 = ev('dave', 1,
  'My Hermes node setup, roast me\nhttps://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=80',
  [['imeta', 'url https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=80', 'm image/jpeg', 'dim 640x426']],
  ago(1 * day));
const P5 = ev('eve', 1, 'gm', [], ago(2 * day));
const P6 = ev('alice', 1,
  'Reminder: community call every Friday 18:00 UTC on the relay.',
  [['t', 'community']], ago(30 * min));
events.push(P1, P2, P3, P4, P5, P6);

// ── Poll (kind 1068, NIP-88) — active poll with responses ──────────────────
const POLL_ENDS = BASE + 2 * day; // ends in 2 days from base time
const POLL1 = ev('alice', 1068,
  'Should we move the community call to Discord?\n\nRelay-only has been limiting attendance. Discord would be easier for newcomers.',
  [
    ['option', 'opt_yes', 'Yes, move to Discord'],
    ['option', 'opt_no', 'No, keep relay-only'],
    ['option', 'opt_both', 'Hybrid — relay + Discord'],
    ['option', 'opt_other', 'Other platform'],
    ['polltype', 'singlechoice'],
    ['endsAt', String(POLL_ENDS)],
    ['title', 'Should we move the community call to Discord?'],
    ['t', 'community'],
    ['t', 'governance'],
    ['relay', RELAYS[0]],
  ],
  ago(4 * hr));
events.push(POLL1);

// Poll responses (kind 1018, NIP-88)
const pollRespond = (author: Author, poll: VerifiedEvent, optionId: string, created: number) =>
  ev(author, 1018, '', [['e', poll.id], ['response', optionId]], created);
// 3 votes for "Yes", 2 for "No", 1 for "Hybrid"
events.push(pollRespond('bob', POLL1, 'opt_yes', ago(3 * hr + 50 * min)));
events.push(pollRespond('carol', POLL1, 'opt_yes', ago(3 * hr + 40 * min)));
events.push(pollRespond('dave', POLL1, 'opt_yes', ago(3 * hr + 30 * min)));
events.push(pollRespond('eve', POLL1, 'opt_no', ago(3 * hr + 20 * min)));
events.push(pollRespond('bob', POLL1, 'opt_no', ago(3 * hr + 10 * min))); // bob changes mind (latest wins)
events.push(pollRespond('carol', POLL1, 'opt_both', ago(3 * hr + 5 * min))); // carol changes mind (latest wins)
// Final tally: opt_yes: 2 (bob→dave), opt_no: 1 (eve), opt_both: 1 (carol), opt_other: 0

// ── Comments on P1 (kind 1, NIP-10 marked e tags) — nested tree ─────────────
const root = (id: string, p: string) => ['e', id, HINT, 'root', p] as string[];
const reply = (id: string, p: string) => ['e', id, HINT, 'reply', p] as string[];
const pTag = (p: string) => ['p', p, HINT] as string[];

const C1 = ev('bob', 1, 'The merge-mining angle is interesting — does it affect quorum math?',
  [root(P1.id, PK.alice), pTag(PK.alice)], ago(110 * min));
const C1a = ev('carol', 1, 'Not directly, but it changes the attacker-cost assumption.',
  [root(P1.id, PK.alice), reply(C1.id, PK.bob), pTag(PK.bob)], ago(95 * min));
const C1a1 = ev('dave', 1, 'Exactly — that\'s the underrated part of the proposal.',
  [root(P1.id, PK.alice), reply(C1a.id, PK.carol), pTag(PK.carol)], ago(80 * min));
const C2 = ev('eve', 1, '+1, quorum has been a bottleneck for months.',
  [root(P1.id, PK.alice), pTag(PK.alice)], ago(85 * min));
events.push(C1, C1a, C1a1, C2);

// ── Reactions (kind 7, NIP-25) — + / - / empty / emoji / dedupe ─────────────
// target = last e tag ([1]); + / "" = upvote, - = downvote, emoji ignored.
const react = (author: Author, target: VerifiedEvent, targetPk: string, content: string, created: number) =>
  ev(author, 7, content, [['e', target.id, HINT, targetPk], ['p', targetPk, HINT], ['k', String(target.kind)]], created);

// P1: popular, +3 (carol/dave/eve up)
events.push(react('carol', P1, PK.alice, '+', ago(118 * min)));
events.push(react('dave', P1, PK.alice, '+', ago(117 * min)));
events.push(react('eve', P1, PK.alice, '+', ago(116 * min)));
// P2: link post, +3 — incl. an EMPTY content reaction (NIP-25: "" = upvote)
events.push(react('alice', P2, PK.bob, '+', ago(4 * hr)));
events.push(react('carol', P2, PK.bob, '+', ago(3 * hr + 50 * min)));
events.push(react('eve', P2, PK.bob, '', ago(3 * hr + 40 * min))); // empty = up
// P3: controversial, net -3 (carol up; alice/bob/dave/eve down)
events.push(react('carol', P3, PK.carol, '+', ago(7 * hr)));
events.push(react('alice', P3, PK.carol, '-', ago(6 * hr + 50 * min)));
events.push(react('bob', P3, PK.carol, '-', ago(6 * hr + 40 * min)));
events.push(react('dave', P3, PK.carol, '-', ago(6 * hr + 30 * min)));
events.push(react('eve', P3, PK.carol, '-', ago(6 * hr + 20 * min)));
// P4: zero reactions (tests "no votes" state) — intentionally none
// P5: emoji-only (score stays 0; emoji is display-only)
events.push(react('alice', P5, PK.eve, '👍', ago(1 * day + 12 * hr)));
// P6: SELF-VOTE + dedupe — alice votes - (old) then + (new); latest wins ⇒ +1
events.push(react('alice', P6, PK.alice, '-', ago(29 * min)));
events.push(react('alice', P6, PK.alice, '+', ago(28 * min))); // newer ⇒ overrides
// C1: vote on a comment
events.push(react('alice', C1, PK.bob, '+', ago(70 * min)));

// ── Article (kind 30023, NIP-23) — target for article comments ─────────────
const A1 = ev('alice', 30023,
  '# Zenon Network Quarterly Update\n\nSigns of life from the sleeping giant. The merge-mining section is the bullish part, and the BTC treasury build-up is underrated.\n\nRead more on the site.',
  [['d', 'zenon-quarterly-update-seed'],
   ['title', 'Zenon Network Quarterly Update'],
   ['summary', 'Signs of life from the sleeping giant.'],
   ['published_at', String(ago(4 * day))],
   ['t', 'zenon'],
   ['image', 'https://brink.dev/og/hornet.png'],
   ['canonical_url', 'https://atsocy.com/zenon-quarterly-update-seed']],
  ago(4 * day));
events.push(A1);
const ADDR = `30023:${PK.alice}:zenon-quarterly-update-seed`;

// ── Article comments (kind 1111, NIP-22) — top-level + nested ───────────────
// uppercase = root scope (A/K/P), lowercase = parent (a/e/k/p).
const AC1 = ev('bob', 1111, 'Great write-up — the merge-mining section finally clicked for me.',
  [['A', ADDR, HINT], ['K', '30023'], ['P', PK.alice, HINT],
   ['a', ADDR, HINT], ['e', A1.id, HINT, PK.alice], ['k', '30023'], ['p', PK.alice, HINT]],
  ago(3 * day + 6 * hr));
const AC1a = ev('carol', 1111, 'Agreed, though I\'d push back on the treasury framing.',
  [['A', ADDR, HINT], ['K', '30023'], ['P', PK.alice, HINT],
   ['e', AC1.id, HINT, PK.bob], ['k', '1111'], ['p', PK.bob, HINT]],
  ago(3 * day + 5 * hr));
const AC2 = ev('dave', 1111, 'Bookmarking this for the community call.',
  [['A', ADDR, HINT], ['K', '30023'], ['P', PK.alice, HINT],
   ['a', ADDR, HINT], ['e', A1.id, HINT, PK.alice], ['k', '30023'], ['p', PK.alice, HINT]],
  ago(3 * day + 4 * hr));
events.push(AC1, AC1a, AC2);

// ── Publish ─────────────────────────────────────────────────────────────────
async function main() {
  const pool = new SimplePool();
  let ok = 0;
  for (const e of events) {
    try {
      const [res] = pool.publish(RELAYS, e);
      await res;
      ok++;
    } catch (err) {
      console.error(`✗ ${e.kind}:${e.pubkey.slice(0, 8)} failed:`, err);
    }
  }
  pool.close(RELAYS);
  console.log(`Seeded ${ok}/${events.length} events to ${RELAYS.join(', ')}`);
  console.log(`  posts:    6  (P1 +3 · P2 link +3 · P3 −3 · P4 image 0 · P5 emoji 0 · P6 self +1)`);
  console.log(`  poll:     1  (kind 1068 · 4 options · 5 responses · ends +2d)`);
  console.log(`  comments: 4  on P1 (2 branches, 3 deep) + 3 NIP-22 on article`);
  console.log(`  reactions: 15 (incl. empty-as-up, emoji, dedupe)`);
  console.log(`  profiles: 4   (eve has none → truncated npub)`);
  console.log(`  article:  1   (30023:...:zenon-quarterly-update-seed)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
