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

## Caching

The supported-currency list is cached in memory for 24 hours. Latest unit rates
are cached per base/target pair for 5 minutes, so converting different amounts
with the same pair does not consume additional provider requests. Historical
rates are requested directly.

## Deploy (Railway + Docker)

Railway builds this service from the [`Dockerfile`](Dockerfile) using BuildKit.
Build/deploy settings are defined in [`railway.json`](railway.json).

1. **New Project** → **Deploy from GitHub repo**.
2. Service → **Settings**:
   - **Root Directory:** `backend`
   - **Builder:** Dockerfile
   - **Dockerfile Path:** `/backend/Dockerfile`
   - Leave Custom Build Command and Custom Start Command empty (the Dockerfile
     builds and starts the app).
3. Add environment variables:

| Variable | Value |
| --- | --- |
| `FREE_CURRENCY_API_KEY` | your FreeCurrencyAPI key |
| `FREE_CURRENCY_BASE_URL` | `https://api.freecurrencyapi.com/v1` |
| `FRONTEND_URL` | your Netlify site origin, no trailing slash, e.g. `https://your-app.netlify.app` |
| `PORT` | leave empty (Railway sets this) |

4. **Networking** → **Generate Domain**.
5. Check `https://<your-domain>.up.railway.app/health` → `{ "status": "ok" }`.

Copy the domain into the frontend's `VITE_API_BASE_URL`.

Local image build:

```bash
cd backend
DOCKER_BUILDKIT=1 docker build -t currency-converter-api .
```

### Common failures

| Error | Cause | Fix |
| --- | --- | --- |
| Dockerfile / package.json not found | Root Directory not set | Set Root Directory to `backend` |
| GitHub Repo not found | Railway GitHub app missing access | Reconnect GitHub and grant the repo |
| CORS blocked | `FRONTEND_URL` mismatch | Use the exact Netlify origin with no trailing slash |

## Commands

```bash
npm run start:dev
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
```
