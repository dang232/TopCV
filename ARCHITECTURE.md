# Architecture

## Folder structure

- **`fe/`**: Next.js app (UI).
  - **`fe/app/`**: Route layer. Composes features.
  - **`fe/src/features/`**: Product features. Each feature exposes a public entrypoint (`fe/src/features/<feature>/index.ts`).
  - **`fe/src/shared/`**: Frontend-only shared utilities (UI helpers, client-side libs).
- **`be/`**: NestJS app (API).
  - **`be/src/`**: Backend code, organized by bounded context / module.
    - **`domain/`**: Core domain types + invariants (no framework dependencies).
    - **`application/`**: Use-cases and ports. Orchestrates domain logic and persistence.
    - **`infrastructure/`** (or similar): Adapters, DB clients, external integrations.
- **`shared/`**: Cross-cutting **contract** package (`@topcv/shared`) used by FE and BE.
  - Exports **wire-level** schemas/types/enums only (DTO shapes, input payload shapes, stable keys, transport errors).

## Allowed import directions

### Frontend

- **`fe/app/**`**
  - ✅ May import from **feature public entrypoints**: `@/src/features/<feature>`
  - ✅ May import from **`@/src/shared/**`**
  - ❌ Must not deep-import feature files: `@/src/features/<feature>/**`

- **`fe/src/features/**`**
  - ✅ May import from **`@/src/shared/**`**
  - ✅ May import from **feature public entrypoints** when composing features (rare; prefer composition in `app/`)
  - ❌ Must not deep-import other feature files: `@/src/features/<feature>/**`

### Backend

- **domain → application → infrastructure** direction only
  - **domain** imports nothing from application/infrastructure
  - **application** may import domain; defines ports for infrastructure
  - **infrastructure** implements ports; may import application + domain

### Shared (`@topcv/shared`)

- **Exports**: schemas/types/enums that define **transport shapes**.
- **Does not export**: business-rule validation (e.g. field answer ranges), persistence logic, or UI logic.
- **Authoritative validation** lives in the backend (and FE may provide only UX-level hints).

## DRY rule

Extract utilities only when:

- **Reused in 2+ places**, and
- The shared abstraction is **clear and stable** (not just a convenience wrapper).

## Authentication & Authorization (Keycloak)

This repo requires **Keycloak (OIDC)** for authentication and **RBAC** for authorization.

### Responsibilities by layer

- **Frontend (Next.js `fe/`)**
  - Initiates **login/register/logout** flows with Keycloak.
  - Enforces **route protection** (public vs protected pages) using Next.js mechanisms (middleware and/or server-side session checks).
  - Calls the backend via **oRPC client**, attaching auth context (cookie/session or bearer token depending on chosen approach).

- **Backend (NestJS `be/`)**
  - Validates access tokens for protected routes (JWT verification via Keycloak **JWKS**).
  - Maps token claims → application roles (e.g. `admin`, `staff`).
  - Enforces authorization in the **application/use-case boundary** (guards/policies), not in the UI.

- **Shared (`@topcv/shared`)**
  - Contains only **transport contracts** (schemas/types/enums, stable error keys).
  - Does not contain Keycloak SDK usage, token parsing, or security logic.

### Roles

- **admin**: manage forms, manage fields, view submissions, admin dashboard.
- **staff**: view active forms, submit forms, view own submissions (if supported).

