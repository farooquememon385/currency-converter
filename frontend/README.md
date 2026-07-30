# Currency Converter Frontend

Mobile-first React + TypeScript (Vite) UI for the currency converter. Built with
functional components, hooks, and Bootstrap.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on port `5173` and proxies `/api` to the backend on port
`3000`. Set `VITE_API_BASE_URL` in `.env` to target a different backend.

## Features

- Dynamic currency dropdowns loaded from the backend
- Amount conversion using latest or historical rates
- Currency swap, loaders, and validation
- Conversion history with date/time, persisted in `localStorage`

## Deploy (Netlify)

Deploy settings live in the repo-root [`netlify.toml`](../netlify.toml): base
`frontend`, build `npm run build`, publish `dist`, and an SPA redirect.

1. **Add new site** → **Import an existing project** → connect the GitHub repo.
2. Netlify reads `netlify.toml`, so leave the build settings as detected.
3. Environment variable:
   - `VITE_API_BASE_URL` — your Railway backend URL, e.g.
     `https://your-app.up.railway.app` (no trailing slash)
4. Deploy.

After deploying, set the backend's `FRONTEND_URL` to this site's origin so CORS
allows the requests.

## Commands

```bash
npm run dev
npm run build
npm run lint
```
