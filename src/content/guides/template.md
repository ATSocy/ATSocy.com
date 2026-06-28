---
title: "Template Guide"
description: "Sample draft guide demonstrating the frontmatter schema."
pubDate: 2026-06-22
draft: true
comments: true
nostr: false
tags:
  - template
  - guides
---

This is a template guide. Keep `draft: true` while editing. Set `draft: false` when ready; the page publishes at `/guides/{slug}`.

## Frontmatter reference

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Page title and listing heading. |
| `description` | yes | SEO summary and card dek. |
| `pubDate` | yes | Publication date (`YYYY-MM-DD`). |
| `draft` | yes | `true` hides from `/guides` and routes. |
| `comments` | no | `false` disables the comment thread. Default: `true`. |
| `nostr` | no | `true` syndicates to Nostr on deploy. Default: `false` for guides. |
| `tags` | yes | Topic tags. |
| `updatedDate` | no | Last updated date. |
| `heroImage` | no | Path to hero image. Requires `heroImageAlt`. |
| `heroImageAlt` | when `heroImage` set | Accessibility text. |
| `canonicalUrl` | no | Defaults to `{SITE_URL}/guides/{slug}`. |
