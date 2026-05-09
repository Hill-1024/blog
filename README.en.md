# Hill Blog

[中文](./README.md) | English | [日本語](./README.ja.md)

<img align="right" src="logo.png" width="160" alt="Blog logo">

This is Hill's personal blog site repository, built with Astro and the Mizuki theme system. It powers the current blog site, including posts, special pages, search, archives, friends, diary, anime tracking, comments, and performance tooling.

If you only want the article content, see the separate content repository: [BlogContent](https://github.com/Hill-1024/BlogContent). This repository owns the site code, theme configuration, build workflow, and deployment output.

## Site Features

- Astro-based static site generation.
- Mizuki-style blog theme with custom visual configuration.
- Markdown / MDX rendering and extended syntax.
- Pagefind site search.
- RSS, sitemap, and SEO metadata.
- Archives, categories, tags, pinned posts, and drafts.
- Friends, About, Diary, Anime tracking, and other special pages.
- Twikoo comment integration.
- Lighthouse / performance baseline scripts.
- Content repository synchronization workflow.

## Stack

- Astro 5
- TypeScript
- Svelte
- Tailwind CSS
- Expressive Code
- Pagefind
- Swup
- pnpm workspace

## Quick Start

```bash
pnpm install
pnpm dev
```

Default development URL:

```text
http://localhost:4321
```

## Build and Preview

```bash
pnpm build
pnpm preview
```

Recommended before committing:

```bash
pnpm check
pnpm lint
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Astro development server |
| `pnpm build` | Build the production site |
| `pnpm preview` | Preview the build output |
| `pnpm check` | Run Astro/TypeScript checks |
| `pnpm new-post` | Create a new post |
| `pnpm sync-content` | Sync the external content repository |
| `pnpm init-content` | Initialize the content source |
| `pnpm format` | Format code |
| `pnpm lint` | Run linting |
| `pnpm performance:check` | Run performance checks |

## Project Structure

```text
.
├── src/
├── public/
├── docs/
├── scripts/
├── astro.config.mjs
├── pagefind.yml
├── performance-baseline.json
├── package.json
└── pnpm-lock.yaml
```

| Path | Purpose |
| --- | --- |
| `src/` | Astro pages, components, content collections, and theme logic |
| `public/` | Static assets |
| `scripts/` | Content sync, post creation, font compression, and performance scripts |
| `docs/` | Theme notes and images |
| `astro.config.mjs` | Astro and plugin configuration |
| `pagefind.yml` | Search index configuration |
| `performance-baseline.json` | Performance baseline |

## Content Workflow

Blog content can be synced from [BlogContent](https://github.com/Hill-1024/BlogContent) or maintained directly in the site's content directories. Posts use frontmatter for title, publication date, summary, tags, category, cover image, pinned state, and draft state.

Long-lived content should live in the content repository, while theme code, styles, components, and deployment configuration stay here.

## Deployment

The project outputs a static site and can be deployed to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host. Before deployment, check:

- Site URL, title, social links, and comment settings in `src/config.ts`.
- Optional environment variables listed in `.env.example`.
- Content sync status.
- Search index and RSS output.

Do not commit real `.env` files, private tokens, or unredacted sensitive content.

## Upstream

The site is customized from the Mizuki theme system. Thanks to Astro, Mizuki, and the surrounding open-source ecosystem.

## License

Code follows the Apache License 2.0 in this repository. Articles, images, and personal content may have separate usage terms.
