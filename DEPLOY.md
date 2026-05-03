# Deploy TopCV for $0 (realistic options)

Your stack needs **MongoDB**, **Redis**, **Elasticsearch**, **Keycloak**, the **Nest API**, and the **Next.js** app. Fully managed “everything free forever” on separate SaaS products is not realistic (hosted Elasticsearch is almost always paid or trial). The approaches below **do work** and stay at **$0** if you accept trade-offs (self-hosting ops, or cold starts).

## Option A — One free VPS + Docker (recommended for “100% free + full control”)

Use **Oracle Cloud Infrastructure “Always Free”** (ARM Ampere A1: up to 4 OCPUs / 24 GB RAM on eligible shapes) or another small free tier VM. You run the same services you already have in `docker-compose.yml`, plus API and web containers.

### 1) Create the VM

- Ubuntu 22.04+, open ports **80** and **443** (and **8080** only if you expose Keycloak directly; prefer a reverse proxy).
- Install Docker Engine + Compose plugin.

### 2) Clone the repo on the server

```bash
git clone https://github.com/<you>/TopCV.git && cd TopCV
```

### 3) Infra (Mongo, Redis, ES, Keycloak)

```bash
docker compose up -d mongodb redis elasticsearch keycloak-db keycloak
```

Wait until Elasticsearch is green and Keycloak is up (first boot can take a few minutes).

### 4) Build and run the API

Create a file `be.env` (do **not** commit secrets) with at least:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_ORIGIN` | `https://your-domain.com` (no trailing slash; comma-separate if multiple) |
| `MONGODB_URL` | `mongodb://mongodb:27017` (hostname = compose service name) |
| `MONGODB_DB_NAME` | `topcv` |
| `REDIS_URL` | `redis://redis:6379` |
| `ELASTICSEARCH_URL` | `http://elasticsearch:9200` |
| `KEYCLOAK_ISSUER` | `http://keycloak:8080/realms/<realm>` (must match how the API reaches Keycloak; inside Docker use service DNS) |
| `KEYCLOAK_CLIENT_ID` | match realm client |
| `KEYCLOAK_ADMIN_CLIENT_ID` / `KEYCLOAK_ADMIN_CLIENT_SECRET` | from your realm |

Build and run:

```bash
docker build -f be/Dockerfile -t topcv-api .
docker run -d --name topcv-api --env-file be.env --network topcv_default -p 3000:3000 topcv-api
```

Use the real Compose network name (`docker network ls`) instead of `topcv_default` if different, so the API can resolve `mongodb`, `redis`, `elasticsearch`, `keycloak`.

### 5) Build and run the Next app

Build with **your public API URL** baked into `NEXT_PUBLIC_*` (Next inlines these at build time):

```bash
docker build -f fe/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com \
  --build-arg NEXT_PUBLIC_KEYCLOAK_URL=https://auth.your-domain.com \
  --build-arg NEXT_PUBLIC_KEYCLOAK_REALM=<realm> \
  --build-arg NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=<public-client-id> \
  -t topcv-web .
docker run -d --name topcv-web -p 3001:3000 topcv-web
```

Put **Caddy** or **nginx** in front for HTTPS (Let’s Encrypt) and proxy:

- `https://app.your-domain.com` → `topcv-web:3000`
- `https://api.your-domain.com` → `topcv-api:3000` (and `/rpc` on the same host)

### 6) CORS

`FRONTEND_ORIGIN` on the API must include the exact browser origin of the Next app (scheme + host + port if non-default).

---

## Option B — Vercel (frontend) + free-ish backend (split services)

### Frontend — Vercel (hobby tier)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. **Root Directory:** `fe`
3. **Node:** 20.x  
4. Set **Environment variables** in the Vercel project (Production + Preview):

   - `NEXT_PUBLIC_API_BASE_URL` — your public API origin, e.g. `https://api.example.com`
   - `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`

5. Deploy. `fe/vercel.json` runs `pnpm` from the monorepo root so `@topcv/shared` resolves.

**Note:** `fe/next.config.ts` rewrites `/rpc` to `API_PROXY_TARGET` (default `http://localhost:3000`). For production you may set `API_PROXY_TARGET` in Vercel to your API origin so server-side RPC proxy hits the right host.

### Backend + data

- **MongoDB:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 cluster (free).
- **Redis:** [Upstash](https://upstash.com/) free tier.
- **Elasticsearch:** no durable free tier that matches your `@elastic/elasticsearch` client is guaranteed; keep ES on the **same VPS as Option A**, or use a paid Elastic Cloud deployment.
- **Keycloak:** self-host on the same VPS (as in `docker-compose.yml`) or a second small VM.

Run the API with `be/Dockerfile` on [Render](https://render.com/) free web service, [Fly.io](https://fly.io/) free allowance, or the same Oracle VM.

---

## Option C — Backend on your PC (ngrok) + frontend on Vercel

Yes, this works for **demos and development**. The browser loads the app from Vercel and calls your API through the **ngrok HTTPS URL**.

### 1) Run the stack locally

Start Mongo, Redis, Elasticsearch, Keycloak (e.g. `docker compose up -d ...`) and the API (`pnpm dev:be` or `pnpm --filter be start`) on the port ngrok will forward (default **3000**).

### 2) Expose the API with ngrok

```bash
ngrok http 3000
```

Copy the **https** forwarding URL (e.g. `https://abc123.ngrok-free.app`).

### 3) CORS on the API

Set **`FRONTEND_ORIGIN`** on the machine running Nest to your Vercel origins (comma-separated if you use Preview + Production), for example:

```text
FRONTEND_ORIGIN=https://your-app.vercel.app,https://your-app-git-main-yourteam.vercel.app
```

`be/src/main.ts` reads this for `Access-Control-Allow-Origin`. If it does not include the exact browser origin, the browser will block API calls.

### 4) Vercel env for the Next app

In the Vercel project (**Root Directory** = `fe`), set at least:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Your ngrok origin, e.g. `https://abc123.ngrok-free.app` (no trailing slash) |
| `NEXT_PUBLIC_KEYCLOAK_*` | Must be URLs the **browser** can open. If Keycloak is only `http://localhost:8080`, logins from the Vercel site will **not** work until Keycloak is also reachable on a public URL (second ngrok tunnel, or host KC in the cloud). |

Redeploy after changing `NEXT_PUBLIC_*` (they are baked in at build time).

### 5) Trade-offs (read this once)

- Your PC and ngrok must stay **running**; closing the laptop stops the API.
- Free ngrok URLs **change** when the tunnel restarts unless you use a **reserved domain** (paid feature on ngrok).
- **Keycloak** and any **server-side** Next code that calls the API must use URLs that are reachable from where that code runs (browser vs Vercel server).

---

## What we ship in-repo

| File | Purpose |
|------|---------|
| `be/Dockerfile` | Production API image (pnpm workspace + `tsx` for `@topcv/shared` TS). |
| `fe/Dockerfile` | Production Next image; pass `NEXT_PUBLIC_*` build-args. |
| `fe/vercel.json` | Monorepo install/build when Vercel **Root Directory** is `fe`. |
| `.dockerignore` | Smaller/faster Docker builds. |

---

## Costs truthfully

| Piece | Typical $0 approach |
|-------|---------------------|
| Next.js | Vercel hobby, or Docker on a free VM |
| Nest API | Docker on free VM, or Render/Fly free tier (cold starts / limits) |
| Mongo / Redis | Atlas M0 + Upstash |
| Elasticsearch | Same VM as Docker **or** paid cloud |
| Keycloak | Same VM (compose) |

If you tell us your preferred host (Oracle vs Render+Vercel vs other), we can narrow this to a single copy-paste checklist for that path only.
