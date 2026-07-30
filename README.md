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

## Tech stack

- Frontend: React, TypeScript, Vite, Bootstrap
- Backend: NestJS, Axios
- Data: FreeCurrencyAPI
