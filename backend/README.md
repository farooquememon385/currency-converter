# Currency Converter API

NestJS backend for the currency converter. It keeps the FreeCurrencyAPI key
server-side and exposes only the data required by the React application.

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

Add a valid `FREE_CURRENCY_API_KEY` to `.env`. The API runs on port `3000` by
default.

## Endpoints

- `GET /health` — service health check
- `GET /api/currencies` — all currencies supported by FreeCurrencyAPI
- `GET /api/currencies/latest?base=USD&currencies=EUR,GBP` — latest rates
- `GET /api/currencies/historical?date=2024-01-15&base=USD&currencies=EUR,GBP`
  — rates for a historical date

The `base` query defaults to `USD`. The optional `currencies` query accepts
comma-separated three-letter currency codes.

## Commands

```bash
npm run start:dev
npm run build
npm test
npm run test:e2e
npm run lint
```
