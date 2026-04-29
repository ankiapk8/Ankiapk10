# Deploying to Render

This project ships with a `Dockerfile` and `render.yaml` Blueprint that deploy
the Anki Card Generator (frontend + API server) as a single web service backed
by a managed Postgres database.

## What gets deployed

- **Web service** (`anki-generator`) — Docker container. Runs the Express API
  and serves the built React frontend on the same port.
- **Postgres database** (`anki-generator-db`) — Managed Postgres 16. Connection
  string is wired into the web service automatically as `DATABASE_URL`.

## One-time setup on Render

1. Push this repo to GitHub.
2. In the Render dashboard, click **New → Blueprint** and point it at the repo.
   Render reads `render.yaml` and creates the service + database.
3. When prompted, set the only secret value: `OPENROUTER_API_KEY`.
   This must be a real OpenRouter API key (`sk-or-...`) from
   https://openrouter.ai/keys.
4. Wait for the first build to finish (5–10 min — Docker has to compile the
   `canvas` native module). The service will run database migrations on boot.

## Required environment variables

| Variable                          | Source                          | Notes |
|-----------------------------------|---------------------------------|-------|
| `DATABASE_URL`                    | Render Postgres (auto-injected) | Wired by `render.yaml` |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Set in `render.yaml`            | `https://openrouter.ai/api/v1` |
| `OPENROUTER_API_KEY`              | You provide on first deploy     | Real OpenRouter key (`sk-or-...`) |
| `PORT`, `STATIC_DIR`, `NODE_ENV`  | Set in `render.yaml`            | Don't change |

The app talks to OpenRouter using the OpenAI-compatible chat completions API,
so the same client library works in Replit dev and on Render.

## Local Docker test

```bash
docker build -t anki-generator .
docker run --rm -p 8080:8080 \
  -e DATABASE_URL="postgres://user:pw@host:5432/db" \
  -e AI_INTEGRATIONS_OPENAI_BASE_URL="https://openrouter.ai/api/v1" \
  -e OPENROUTER_API_KEY="sk-or-..." \
  anki-generator
```

Then open http://localhost:8080.

## How it differs from the Replit dev setup

- In dev on Replit, the Vite dev server (`anki-generator`) and the API
  (`api-server`) run as two separate processes on different ports.
- In the Docker image used on Render, Vite is only used at build time. The
  built static files are served by Express from `/app/public`, so the user
  hits a single port (`PORT=8080`).
- `BASE_PATH` is set to `/` at build time (the app lives at the root of the
  Render domain), instead of `/__anki-generator` like in the Replit preview.

## Updating the deployment

Push to your GitHub branch — Render rebuilds and redeploys automatically
(`autoDeploy: true`).

## APK builder note

The Android APK builder requires the Android SDK at `/home/runner/android-sdk`
and only works on Replit. On Render the API server logs a warning and serves
the last APKs that were checked into `build-apk/` (if any). The rest of the
app is unaffected.
