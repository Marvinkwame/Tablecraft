# tablecraft — live demo

Feature showcase for [`@marvinackerman/tablecraft`](https://www.npmjs.com/package/@marvinackerman/tablecraft).

## Local development

```bash
cd demo
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to demo/dist
```

## Deploy (Vercel — one-time setup)

1. Push this repo to GitHub.
2. In the Vercel dashboard, **Add New → Project** and import the `Tablecraft` repo.
3. Under **Root Directory**, choose `demo`.
4. Framework preset auto-detects **Vite**; build command `npm run build`, output `dist` (already set in `vercel.json`).
5. Deploy. Every push to `main` redeploys automatically.

## Iterating against local library source

The demo installs the published npm package by default. To test unreleased
library changes, uncomment the `resolve.alias` block in `vite.config.ts`.
