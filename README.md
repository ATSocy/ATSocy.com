<div align="center">

<img src="./.github/atsocy.png" alt="ATSocy" width="120" />

# ATSocy.com

Alien Trap Society

Collective action that transcends time and space.

[ATSocy.com](https://atsocy.com) · [X](https://x.com/ATSocy) · [Nostr](https://nostr.com/nprofile1qqstefhn3k2jdey9s3awpvuthd3vymu4660xvprzrs0s9rwsrcad79cn9kyvn)

</div>

## Why it exists

ATS covers the entire Zenon Network ecosystem with technical depth and humor. Articles are pushed to Nostr and statically built for indexability. Accounts are sovereign.

Other features include a Reddit style section named Pulse with multimedia posts, per-article comments, a dev activity rail, and AI-generated channel summaries.

## How to use it

<h3 align="center">REQUIREMENTS</h3>

<p align="center">
  <a href="https://nodejs.org/" target="_blank">
    <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=for-the-badge" alt="Node.js">
  </a>
  <a href="https://astro.build/" target="_blank">
    <img src="https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white&style=for-the-badge" alt="Astro">
  </a>
  <a href="https://react.dev/" target="_blank">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="React">
  </a>
  <a href="https://pages.cloudflare.com/" target="_blank">
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white&style=for-the-badge" alt="Cloudflare Pages">
  </a>
</p>

### Quick start

```bash
npm install
npm run dev:mock
```

`dev:mock` runs the UI against in-memory mock Nostr events. No relay needed; the fastest path for component and layout work.

### Local Nostr modes

```bash
npm run dev:mock    # in-memory mock events
npm run dev:relay   # real local relay at ws://127.0.0.1:7777
```

`dev:relay` expects a local atsrfry/strfry-compatible relay on port `7777`.


Deploys go to Cloudflare Pages via Wrangler (`npm run wrangler:deploy`). Publishing an article to Nostr is a separate step (`npm run publish:nostr`).

Components are grouped by feature, not by file type. `.astro` is server-rendered shell; `.tsx` hydrates on the client.

## Public API

- `https://api.atsocy.com/dev-activity.json` — recent activity across tracked Zenon ecosystem repos
- `https://api.atsocy.com/prices.json` — ZNN and QSR prices in sats, ETH, and USD

## Contributing

Open an issue or a [Discussion](https://github.com/ATSocy/ATSocy.com/discussions) to start. Pull requests are welcome — just open one first so we can align before you ship code.

To suggest a Dev Activity source to track, edit [`dev-activity-sources.json`](./src/config/dev-activity-sources.json) and open a PR.

## License

MIT
