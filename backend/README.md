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

## Deploy (Render + GitHub)

Push the repo to GitHub, then deploy this backend as a free Web Service on
[Render](https://render.com/).

1. Dashboard → **New** → **Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
3. Environment variables:

| Variable | Value |
| --- | --- |
| `FREE_CURRENCY_API_KEY` | your FreeCurrencyAPI key |
| `FREE_CURRENCY_BASE_URL` | `https://api.freecurrencyapi.com/v1` |
| `FRONTEND_URL` | your frontend URL, e.g. `https://your-app.netlify.app` |
| `PORT` | leave empty (Render sets this) |

4. Create the service and wait for the first deploy.
5. Open `https://<your-service>.onrender.com/health` — it should return
   `{ "status": "ok" }`.

Copy the service URL into the frontend's `VITE_API_BASE_URL` env var.

> Free instances sleep when idle. The first request after inactivity can take
> ~30–60 seconds.

## Deploy (Railway)

Railway builds this service with a **Dockerfile** (BuildKit).

1. **New Project** → **Deploy from GitHub repo**.
2. Service → **Settings**:
   - **Root Directory:** `backend`
   - Clear any custom build command (Dockerfile handles the build)
3. Add environment variables:

| Variable | Value |
| --- | --- |
| `FREE_CURRENCY_API_KEY` | your FreeCurrencyAPI key |
| `FREE_CURRENCY_BASE_URL` | `https://api.freecurrencyapi.com/v1` |
| `FRONTEND_URL` | your frontend URL, e.g. `https://your-app.netlify.app` |
| `PORT` | leave empty (Railway sets this) |

4. **Networking** → **Generate Domain**.
5. Check `https://<your-domain>.up.railway.app/health`.

Local image build:

```bash
cd backend
DOCKER_BUILDKIT=1 docker build -t currency-converter-api .
```

### Common build failures

| Error | Cause | Fix |
| --- | --- | --- |
| Dockerfile / package.json not found | Root Directory not set | Set Root Directory to `backend` |
| GitHub Repo not found | Railway GitHub app missing access | Reconnect GitHub and grant the repo |
| CORS errors from frontend | `FRONTEND_URL` wrong | Set it to the Netlify site origin |

## Commands

```bash
npm run start:dev
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
```
