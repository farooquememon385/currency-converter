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

## Commands

```bash
npm run dev
npm run build
npm run lint
```
