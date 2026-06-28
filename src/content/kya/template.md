---
title: "Template KYA Interview"
description: "Sample draft Know Your Alien interview."
pubDate: 2026-06-22
draft: true
tags:
  - template
  - interview
---

This is a template KYA interview. Keep `draft: true` while editing. Set `draft: false` when ready; the page publishes at `/kya/{slug}`.

## Frontmatter reference

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Interview title (e.g. `Know Your Alien: Name`). |
| `description` | yes | SEO summary and card dek. |
| `pubDate` | yes | Publication date (`YYYY-MM-DD`). |
| `draft` | yes | `true` hides from `/kya` and routes. |
| `comments` | no | `false` disables the comment thread. Default: `true`. |
| `nostr` | no | `true` syndicates to Nostr on deploy. Default: `true`. |
| `tags` | yes | Topic tags. |
| `updatedDate` | no | Last updated date. |
| `heroImage` | no | Path to hero image. Requires `heroImageAlt`. |
| `heroImageAlt` | when `heroImage` set | Accessibility text. |
| `canonicalUrl` | no | Defaults to `{SITE_URL}/kya/{slug}`. |
