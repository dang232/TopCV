# TopCV

**TopCV** is a dynamic form-builder and submission system: admins define forms and fields; staff complete active forms in order. The codebase is a **pnpm monorepo** with a **Next.js** App Router frontend (`fe/`), a **NestJS** backend (`be/`), typed **oRPC** contracts and **Zod** schemas in **`@topcv/shared`**, **Keycloak** (OIDC) for identity, and **MongoDB**, **Redis**, and **Elasticsearch** for persistence, cache, and search. Product framing, stack versions, and auth expectations are spelled out in [documentation/agent_mindset/Requirements.md](documentation/agent_mindset/Requirements.md) — use that file as the detailed spec; this README is the operational quick path from clone to running apps.

## Repository layout

| Path | Role |
|------|------|
| **`fe/`** | Next.js app (`app/`, `src/`): UI, auth/session helpers, API client |
| **`be/`** | NestJS app: oRPC/REST, MikroORM + MongoDB, Keycloak JWT verification |
| **`shared/`** | `@topcv/shared`: Zod schemas and shared contracts (`exports`: root, `./auth`, `./forms`, `./transport`, `./user`) |
| **`infrastructure/`** | Keycloak realm import (`keycloak/topcv.json`) and local infra notes — see [infrastructure/README.md](infrastructure/README.md) |
| **`documentation/`** | Specs, mindset, and project docs (authoritative product/stack section: [documentation/agent_mindset/Requirements.md](documentation/agent_mindset/Requirements.md)) |
| **`docker-compose.yml`** | Repo root: MongoDB 7, Redis 7 (AOF), Elasticsearch 8.15.3, Keycloak 26.2.0 + PostgreSQL 16 for Keycloak’s DB |

## Prerequisites

- **Node.js** 20+ (workspace packages use Node 20 types; backend is ESM `type: module`)
- **pnpm** `10.33.2` (declared in root `package.json` as `packageManager`)
- **Docker** + Docker Compose, for local databases, search, cache, and Keycloak

## Install

From the repository root:

```bash
pnpm install
```

Dependencies are hoisted across workspaces (`be`, `fe` as `my-app`, `shared`).

## Environment variables

### Backend

Copy and edit **[`be/.env.example`](be/.env.example)** → `be/.env` (or your local env loader). Highlights:

- **HTTP**: `PORT` (default **3000**)
- **CORS**: `FRONTEND_ORIGIN` (e.g. `http://localhost:3001`, …)
- **MongoDB**: `MONGODB_URL`, `MONGODB_DB_NAME`
- **Redis**: `REDIS_URL`
- **Elasticsearch**: `ELASTICSEARCH_URL` (client major should stay aligned with the ES image in Compose)
- **Keycloak JWT**: `KEYCLOAK_ISSUER`, optional `KEYCLOAK_JWKS_URL` / `KEYCLOAK_AUDIENCE`, `KEYCLOAK_CLIENT_ID`; optional `KEYCLOAK_CLIENT_SECRET` for refresh when the client is confidential
- **Keycloak Admin API** (e.g. registration): `KEYCLOAK_ADMIN_CLIENT_ID`, `KEYCLOAK_ADMIN_CLIENT_SECRET`
- **Hardening**: `ALLOW_ADMIN_SIGNUP` — admin signup off by default; enable only in trusted environments

### Frontend (public / build-time)

The app reads **`NEXT_PUBLIC_*`** values (see [`fe/src/shared/config/publicEnv.ts`](fe/src/shared/config/publicEnv.ts)): **`NEXT_PUBLIC_KEYCLOAK_URL`**, **`NEXT_PUBLIC_KEYCLOAK_REALM`**, **`NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`**, and **`NEXT_PUBLIC_API_BASE_URL`** (optional in dev; defaults are applied for API base in some code paths). Use `.env.local` under `fe/` per Next.js conventions.

## Run locally

### 1. Infrastructure (Docker Compose at repo root)

[`docker-compose.yml`](docker-compose.yml) defines **mongodb**, **redis**, **elasticsearch**, **keycloak-db**, and **keycloak** (realm import mounted from `infrastructure/keycloak/topcv.json`).

- **App data services only** (matches root script):

  ```bash
  pnpm services:up
  ```

  Starts **MongoDB**, **Redis**, and **Elasticsearch** only.

- **Full stack including Keycloak** (needed for OIDC login aligned with the backend):

  ```bash
  docker compose up -d
  ```

  Keycloak admin console: **http://localhost:8080** (bootstrap admin defaults and realm `topcv` are described in [infrastructure/README.md](infrastructure/README.md)).

Stop data services: `pnpm services:down` (same Compose project). For a full teardown including Keycloak volumes, use `docker compose down` (add `-v` only if you intend to wipe volumes).

### 2. Backend and frontend

In separate terminals from the **repo root**:

```bash
pnpm dev:be
pnpm dev:fe
```

- **Backend**: **http://localhost:3000** (HTTP + oRPC as implemented; see `be/src/main.ts`)
- **Frontend**: **http://localhost:3001** (`next dev -p 3001` in `fe/package.json`). Example: **http://localhost:3001/forms** for the form builder area. `fe/next.config.ts` can rewrite **`/rpc/*`** to the API (default proxy target **http://localhost:3000** via `API_PROXY_TARGET` when used).

## URLs and ports (local defaults)

| Service | Port |
|---------|------|
| Next.js (dev) | **3001** |
| NestJS API | **3000** |
| Keycloak | **8080** |
| MongoDB | **27017** |
| Redis | **6379** |
| Elasticsearch | **9200** |

## Testing, typecheck, and lint

From the **repo root** (aggregated):

```bash
pnpm test        # shared → be → fe (Vitest)
pnpm typecheck   # @topcv/shared → be → fe
pnpm lint        # fe (ESLint) + be (ESLint); shared has no lint script
```

Per workspace:

```bash
pnpm --filter @topcv/shared test
pnpm --filter @topcv/shared typecheck
pnpm --filter be test
pnpm --filter be typecheck
pnpm --filter be lint
pnpm --filter my-app test
pnpm --filter my-app test:e2e   # Playwright
pnpm --filter my-app typecheck
pnpm --filter my-app lint
```

## Security (high level)

- **Backend is the source of truth** for authorization; the UI may hide controls but must not be relied on for access control.
- **Do not ship secrets in the browser**: use `NEXT_PUBLIC_*` only for non-sensitive, public OIDC/client configuration; keep client secrets and admin credentials server-side (`be/.env`).
- Prefer **minimal token exposure** in the client (see storage guidance in [documentation/agent_mindset/Requirements.md](documentation/agent_mindset/Requirements.md) §0.1).

## Further documentation

- **Detailed product + stack spec**: [documentation/agent_mindset/Requirements.md](documentation/agent_mindset/Requirements.md)
- **Keycloak local setup**: [infrastructure/README.md](infrastructure/README.md)
- **Coding style**: [documentation/project_scope/Coding_Style_Guidelines.md](documentation/project_scope/Coding_Style_Guidelines.md)
- **Forms / oRPC errors**: [documentation/project_scope/Forms_ORPC_Error_Handling.md](documentation/project_scope/Forms_ORPC_Error_Handling.md)

## License

[MIT](LICENSE)
