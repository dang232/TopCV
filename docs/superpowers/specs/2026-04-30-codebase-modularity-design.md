# Codebase Modularity Refactor Design (Encapsulation + SRP + Modular Structure)

**Date:** 2026-04-30  
**Scope:** Monorepo (`fe/`, `be/`, `shared/`, root tooling)  
**Goal:** Make the codebase consistently follow:

- **Encapsulation**: clear module boundaries and explicit public APIs
- **Single Responsibility Principle (SRP)**: each file/function has one job
- **Modular structure**: reusable components/utilities without cross-feature coupling

---

## Background (current state)

The repo is a pnpm workspace with three packages:

- **`fe/`**: Next.js App Router frontend (currently centered around the `forms` feature)
- **`be/`**: NestJS backend (clean/hexagonal layering inside `forms` bounded context)
- **`shared/`**: shared TS/Zod contracts + transport constants used by FE/BE

Key pain points today are not “lack of types” but **lack of enforced boundaries** and a few **SRP hotspots** that will keep accumulating responsibilities as the app grows.

---

## Non-goals (to avoid churn)

- Rewriting the entire folder structure in one sweep (“big bang”)
- Changing the product behavior or UI
- Migrating frameworks (Next/Nest) or package manager
- Introducing Nx/Turborepo unless we later prove we need it

---

## Architecture decision: Approach 1 (“Boundary-first + incremental refactors”)

We will:

1. **Define boundaries and public APIs**
2. **Add enforcement (lint/tsconfig/scripts) so boundaries don’t regress**
3. Refactor the biggest **SRP hotspots** into the new structure (starting with `forms`)
4. Apply the same patterns to future features

This minimizes risk while still converging to a clean, maintainable structure.

---

## Encapsulation: boundaries & public APIs

### Monorepo package boundaries

**Rules:**

- `fe/` and `be/` may depend on `shared/` but must do so via **explicit public exports**, not deep paths.
- `shared/` must not depend on `fe/` or `be/`.
- `be/src/forms/domain/**` must **not** import `shared/` (domain boundary already exists in tests; keep it).

**Design choice:**

- Treat `shared/` as a **contract + primitives** package. Anything that looks like domain/business validation belongs in `be/` domain/application. Frontend can do UX validation, but should not “own” domain rules.

### Frontend boundaries (inside `fe/src`)

We’ll evolve `fe/src` toward a clear layered “feature-sliced-ish” model:

- **`fe/src/shared/`**: cross-feature, generic utilities and infrastructure (API client, error normalization, generic UI primitives)
- **`fe/src/features/<feature>/`**: feature modules (user-facing actions / use-cases) with internal structure and a public entry
- (Optional later) **`fe/src/widgets/`**: page-level composition if needed
- (Optional later) **`fe/src/entities/`**: shared domain-ish UI models if multiple features share them

**Public API rule:**

- `fe/app/**` should import only from:
  - `fe/src/shared/**`
  - `fe/src/features/**/index.ts` (public entrypoints)

No route should deep-import `fe/src/features/**/ui/*` or `model/*` directly once we establish `index.ts`.

### Backend boundaries (inside `be/src`)

Backend already has strong encapsulation within `be/src/forms/*`:

- `domain/` (pure)
- `application/` (use-cases + ports)
- `infrastructure/` (adapters)
- `interface/` (transport)

We will **tighten boundary leaks**:

- Application must not import infrastructure (e.g. cache key helpers living in infra)
- Platform/database config must not hardcode feature entities (feature should register entities)

---

## SRP: responsibilities by file/folder (target)

### Frontend SRP (target responsibilities)

**`fe/src/shared/`**

- `shared/api/orpc/*`: transport client, request/response parse helpers, retry/backoff policy if any (no feature knowledge)
- `shared/lib/*`: generic utilities (no feature terms like “forms”)
- `shared/ui/*`: reusable UI primitives (Button, Input, Panel) if/when needed

**`fe/src/features/forms/`**

- `api/*`: feature-specific API wrappers (still thin is okay; they centralize imports + normalize errors)
- `model/*`: pure functions and types (draft transformations, mapping draft → API input, view-model shaping)
- `hooks/*`: orchestration hooks (state + effects + calling api)
- `ui/*`: React components; “dumb” components prefer props, no API calls
- `index.ts`: public exports (what routes and other modules are allowed to import)

**SRP rule of thumb:**

- React components render UI and handle UI events.
- “Business-ish” mapping/validation lives in `model/` as pure functions.
- Side effects (API calls, caching, toasts) live in `hooks/` or `api/` wrappers.

### Backend SRP (target responsibilities)

**`be/src/forms/application`**

- Use-cases orchestrate ports and return DTOs
- Cache/search/repo concerns expressed only via ports
- Key formats and cache policy live in application-owned helpers (or injected key providers), not in Redis adapter modules

**`be/src/database` / `be/src/infra`**

- Platform modules should provide primitives (EntityManager, Redis client, Elastic client) but not couple to a single bounded context.

---

## Modular structure: concrete target shapes (incremental)

### `fe/` target structure (incremental, not a rewrite)

We will gradually move toward:

- `fe/src/shared/api/orpc/client.ts` (from `fe/src/lib/orpcClient.ts`)
- `fe/src/shared/lib/rpcError.ts` (from `fe/src/lib/rpcError.ts`)
- `fe/src/features/forms/`
  - `api/formsApi.ts` (from `fe/src/features/forms/formsApi.ts`)
  - `model/draft.ts` (split from `formTypes.ts`)
  - `model/mappers.ts` (draft → `CreateFormInput`, etc.)
  - `model/types.ts` (types only)
  - `hooks/useFormsController.ts` (extract orchestration from `FormsPageClient.tsx`)
  - `ui/FormsPageClient.tsx` (becomes composition UI, calls `useFormsController`)
  - `ui/components/*` (optional; move `CreateFormPanel`, `FormsListPanel`, `FormsToolbar`, `FormCard`)
  - `index.ts`

This keeps the feature cohesive while making responsibilities explicit.

### `be/` target structure (incremental)

Keep `forms/` layering as-is. Apply fixes:

- Move any cache key builders used by use-cases out of infrastructure and into application-owned modules.
- Introduce repository/search methods that avoid N+1 (e.g. bulk find by IDs) at the port level (so application remains clean).
- Remove the database config’s dependency on specific feature entity schemas; feature modules register their entities.

### `shared/` target structure (public surface)

We will treat `shared/` exports as the **only supported import surface** for FE/BE:

- Allow: `@topcv/shared`, `@topcv/shared/forms`, `@topcv/shared/transport`, `@topcv/shared/user`
- Disallow: `@topcv/shared/*` deep paths that bypass exports

Contract guidance:

- `shared/` should contain DTO schemas/types and transport constants.
- Any rules that are truly “domain validation” should live in backend domain/application.

---

## Enforcement (so it stays clean)

### TypeScript path + exports discipline

**Frontend (`fe/tsconfig.json`)**

- Remove or narrow the `@topcv/shared/* -> ../shared/*` mapping so it does not enable deep imports.
- Prefer importing the exported subpaths (`@topcv/shared/forms`, etc.).

**Shared (`shared/package.json`)**

- Continue using `exports` as the canonical public API.
- Optionally expand exports gradually when there is a real reuse need.

### ESLint boundary rules

Add architectural lint rules (incremental):

- FE: restrict `fe/app/**` imports to `fe/src/shared/**` and `fe/src/features/**/index.ts`.
- FE: prevent `features/*` from importing other `features/*` internals (only allow public entrypoints if needed).
- FE/BE: prevent deep imports into `shared/` that bypass `exports`.

### Workspace scripts / CI consistency

Ensure root scripts cover all packages:

- `pnpm -r lint`
- `pnpm -r typecheck`
- `pnpm -r test`

(We can choose whether to enforce via pre-commit hooks later; CI is mandatory.)

---

## Migration strategy (order of work)

This is the “small PR sized” order that keeps the repo working:

1. **Boundary enforcement first (no behavior change)**
   - Tighten `shared` import rules (remove deep alias, add ESLint restrictions)
   - Add FE import restrictions for routes/features
2. **Frontend: refactor forms SRP hotspots**
   - Extract `useFormsController` from `FormsPageClient.tsx`
   - Split `formTypes.ts` into `model/*`
   - Keep UI components focused (no API calls inside leaf components)
3. **Backend: remove dependency direction leaks**
   - Remove application imports of infrastructure cache keys
   - Add bulk lookup ports for search results
   - Decouple platform database config from feature entities
4. **Shared: contract cleanup (as needed)**
   - Move any domain-like validation out of shared into backend (keep shared as contracts)

---

## Acceptance criteria

We will consider this refactor successful when:

- **Encapsulation**
  - FE routes only import from `features/*` public entrypoints and `shared/*`
  - No deep imports into `shared/` internals from FE/BE
  - BE application layer does not import infrastructure modules
- **SRP**
  - `FormsPageClient.tsx` is primarily composition UI + calls a controller hook
  - `formTypes.ts` is split into focused model modules (types vs transformations vs mapping)
- **Modularity**
  - Shared API client code is centralized in `fe/src/shared/api/**`
  - Feature code is reusable within its boundaries (UI components don’t “know” transport wiring)
- **Enforcement**
  - ESLint/TS rules prevent regressions (CI fails on boundary violations)

---

## Risks & mitigations

- **Risk: churn from moving files**
  - Mitigation: incremental moves + keep exports stable via `index.ts` entrypoints
- **Risk: “shared” becomes a dumping ground**
  - Mitigation: strict exports; keep `shared/` contracts-only; keep feature logic in `fe/src/features/*` and `be/src/forms/*`
- **Risk: over-engineering early**
  - Mitigation: only add layers when there’s real reuse; keep UI primitives minimal

