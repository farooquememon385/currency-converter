# Currency Converter

A mobile-first currency converter built with a React (Vite) frontend and a
NestJS backend. The backend proxies [FreeCurrencyAPI](https://freecurrencyapi.com/)
so the API key stays private, and it caches responses to reduce request usage.

## Features

- Convert between all currencies supported by FreeCurrencyAPI
- Latest and historical exchange rates
- Conversion history with date/time, persisted across reloads
- Mobile-first Bootstrap UI with loaders and validation
- Backend caching: currencies (24h) and latest unit rates (5m)

## Project structure

- `backend/` — NestJS API and FreeCurrencyAPI proxy ([README](backend/README.md))
- `frontend/` — React + Vite UI ([README](frontend/README.md))

## Getting started

Run the backend and frontend in separate terminals.

```bash
# Backend
cd backend
npm install
cp .env.example .env   # add your FREE_CURRENCY_API_KEY
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

The app is served at `http://localhost:5173` and talks to the backend at
`http://localhost:3000`.

## Deployment

Netlify serves static sites only, so deploy the frontend to Netlify and the
NestJS backend to Railway (or another Node host).

### Backend (Railway + Docker)

Built from [`backend/Dockerfile`](backend/Dockerfile) using BuildKit.

1. New Project → Deploy from GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Builder:** Dockerfile, **Dockerfile Path:** `/backend/Dockerfile`
   - Leave custom build/start commands empty.
3. Environment variables:
   - `FREE_CURRENCY_API_KEY` — your FreeCurrencyAPI key
   - `FREE_CURRENCY_BASE_URL` — `https://api.freecurrencyapi.com/v1`
   - `FRONTEND_URL` — your Netlify origin, no trailing slash
4. Networking → Generate Domain, then copy the URL.

See [backend/README.md](backend/README.md) for details.

### Frontend (Netlify)

The included [`netlify.toml`](netlify.toml) sets the base directory, build
command, publish folder, and SPA redirect.

1. New site → import this repo (settings are read from `netlify.toml`).
2. Environment variable:
   - `VITE_API_BASE_URL` — your Railway backend URL (no trailing slash)
3. Deploy.

After both are live, set the backend's `FRONTEND_URL` to the Netlify origin
(without a trailing slash) so CORS allows the requests.

## Tech stack

- Frontend: React, TypeScript, Vite, Bootstrap
- Backend: NestJS, Axios
- Data: FreeCurrencyAPI
