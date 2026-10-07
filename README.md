# Feisai

Personal blog and documentation built with the official Docusaurus classic template.

Site: https://feisai-tech.github.io/

## Local development

Requires Node.js 22.

```bash
npm ci
npm start
```

Open http://localhost:3000/.

## Write and edit

- Blog posts: `blog/`.
- Tutorials: `docs/tutorial/`.
- Guidelines: `docs/rule/`.
- Homepage and About: `src/pages/`.
- Imported content attribution and license: `src/pages/sources.mdx` and `licenses/`.

### Blog authors

Do not add `authors` to article front matter. The author is resolved from the
article's first Git commit (following file renames), then displayed using that
GitHub account's public name, avatar, and profile link. Later edits do not change
the author. No job title is shown. The `zhengsaihong` account also links to
X: https://x.com/Jeremy8zsh.

Commit new articles before previewing, and push the commit before building:
the GitHub API must be able to find it. Use an email linked to your GitHub account
for Git commits. Full Git history and GitHub API access are required; unresolved
authors stop the build. GitHub Actions supplies its built-in token automatically.
For local builds, `GITHUB_TOKEN` can be set to an existing GitHub token.

Example: `blog/2026-10-07-my-new-post.md`

```md
---
title: My New Post
description: A short introduction.
tags: [技术]
---

Article introduction.

{/* truncate */}

Rest of the article.
```

## Validate

```bash
npm run typecheck
npm run build
```

## Publish

The `.github/workflows/deploy.yml` workflow builds and deploys every push to `main`.
In the repository, set **Settings → Pages → Source** to **GitHub Actions**.
Deployment status is available in the repository's **Actions** tab.

```bash
git add .
git commit -m "Update content"
git push origin main
```
