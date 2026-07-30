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
NestJS backend to a free Node host such as [Render](https://render.com/).

### Backend (Render)

1. New → Web Service, and point it at this repo.
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start:prod`
5. Environment variables:
   - `FREE_CURRENCY_API_KEY` — your FreeCurrencyAPI key
   - `FRONTEND_URL` — your Netlify site URL (for CORS), e.g. `https://your-app.netlify.app`
6. Deploy and copy the service URL, e.g. `https://your-api.onrender.com`.

### Frontend (Netlify)

The included [`netlify.toml`](netlify.toml) sets the base directory, build
command, and SPA redirect.

1. New site → import this repo (settings are read from `netlify.toml`).
2. Environment variable:
   - `VITE_API_BASE_URL` — your Render backend URL, e.g. `https://your-api.onrender.com`
3. Deploy.

After both are live, ensure the backend's `FRONTEND_URL` matches the Netlify
URL so CORS allows the requests.

> Render's free tier sleeps when idle, so the first request after inactivity
> may take a few seconds.

## Tech stack

- Frontend: React, TypeScript, Vite, Bootstrap
- Backend: NestJS, Axios
- Data: FreeCurrencyAPI
