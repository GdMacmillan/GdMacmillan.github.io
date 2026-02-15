# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog for Gordon MacMillan, built with Eleventy 3.0 and deployed to GitHub Pages. Recently migrated from Jekyll to Eleventy.

## Commands

- `npm start` — Dev server with hot reload
- `npm run build` — Production build (outputs to `_site/`)
- `npm ci` — Install dependencies (used in CI)

No test or lint commands are configured.

## Architecture

**Eleventy 3.0** static site using **Nunjucks** templates and **Markdown** content.

- `content/` — Eleventy input directory. Contains `posts/` (Markdown blog posts), `index.njk` (paginated homepage), `about.md`, `sitemap.njk`
- `_includes/layouts/` — Nunjucks layouts: `base.njk` (master HTML), `post.njk` (article page), `home.njk` (paginated post list)
- `_data/metadata.js` — Global site metadata (title, author, URLs)
- `public/` — Static assets (CSS, images), pass-through copied to output
- `eleventy.config.js` — Plugins (syntax highlight, RSS feed), custom filters (`readableDate`, `htmlDateString`, `excerpt`), directory config

**Post conventions:**
- Posts live in `content/posts/` as Markdown with YAML front matter (`title`, optional `coverPhoto`)
- `content/posts/posts.11tydata.js` sets defaults: layout `layouts/post.njk`, tag `posts`, permalink pattern `/{year}/{month}/{day}/{slug}/`

**External CDN dependencies** configured in `base.njk`:
- MathJax for LaTeX rendering
- Prism for syntax highlighting CSS

## Deployment

GitHub Actions (`.github/workflows/eleventy.yml`) auto-deploys on push to `master`: checkout → Node 22 → `npm ci` → `npm run build` → GitHub Pages.
