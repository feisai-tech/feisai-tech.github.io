# Feisai

Personal blog and documentation built with the official Docusaurus classic template.

Site: https://zhengsaihong.github.io/feisai-tech/

## Local development

Requires Node.js 22.

```bash
npm ci
npm start
```

Open http://localhost:3000/feisai-tech/.

## Write and edit

- Blog posts: `blog/`.
- Tutorials: `docs/tutorial/`.
- Guidelines: `docs/rule/`.
- Homepage and About: `src/pages/`.
- Imported content attribution and license: `src/pages/sources.mdx` and `licenses/`.

## Validate

```bash
npm run typecheck
node tests/latest-post.mjs
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
