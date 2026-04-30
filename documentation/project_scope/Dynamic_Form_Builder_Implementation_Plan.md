# Dynamic Form Builder Implementation Plan

### 1. Project Setup
- **Objective**: Align with the repo layout: **`fe/`** for **Next.js 16** (**16.2.4**) + **React 19** (**19.2.4**), **`be/`** for **NestJS 11** + **oRPC**, and **`shared/`** for **Zod** schemas imported by both client and server.
- **Commands**:
  ```bash
  pnpm install
  pnpm services:up
  pnpm dev:be
  pnpm dev:fe
  ```
- **Shared contracts**: Define or extend schemas under `shared/forms/` and consume them from `fe/` and `be/` through the `@topcv/shared` workspace package.

### 2. Form Schema Definition
- **Purpose**: Use **Zod** in **`shared/forms/form.schema.ts`** to describe and validate dynamic forms, fields, submissions, and answer values.
- **Implemented field types**: `text`, `number`, `date`, `color`, and `select`.
- **Implemented validation**: title/description/order/status, field metadata, answer type constraints, color hex values, date rules, and select option membership.

### 3. Dynamic Form UI
- **Implemented route**: `fe/app/forms/page.tsx`.
- **Implemented client component**: `fe/src/features/forms/FormsPageClient.tsx`.
- **Current behavior**: Create a form with one field, list forms, search forms, toggle active/draft status, delete forms, submit answers, and load submissions.
- **Next UX improvements**: Multi-field editing, drag/drop ordering, richer submission review, and optional conditional-display rules.

### 4. Backend API and Persistence
- **API**: oRPC procedures are exposed at `/rpc` through `be/src/forms/interface/orpc.controller.ts` and `be/src/forms/interface/forms.router.ts`.
- **Use cases**: Form create/list/get/update/delete/search/active and submission submit/list live under `be/src/forms/application/`.
- **Persistence**: MongoDB through MikroORM repositories under `be/src/forms/infrastructure/persistence/`.
- **Cache/Search**: Redis caches read paths; Elasticsearch indexes searchable form data.

### 5. Error Handling and User Feedback
- **Objective**: Keep domain/application errors independent from transport concerns, then map them to oRPC errors in the interface layer.
- **Implemented**: `FormNotFound` maps to `FORM_NOT_FOUND`; unexpected errors map to `INTERNAL_SERVER_ERROR`; frontend code normalizes oRPC failures through `ApiRpcFailure`.

### 6. Testing Strategy
- **Implemented commands**:
  ```bash
  pnpm test
  pnpm typecheck
  pnpm lint
  ```
- **Coverage areas**: shared schemas, backend use cases/mappers/cache/search adapters, and frontend forms UI.

### 7. Continuous Updates and Documentation
- **Action**: Bump **Next/React/Nest/Zod** intentionally; refresh this doc when majors change.

---

This plan reflects the current vertical slice: **Next.js under `fe/`**, **NestJS/oRPC under `be/`**, **Zod contracts under `shared/`**, MongoDB/MikroORM persistence, Redis caching, and Elasticsearch search.
