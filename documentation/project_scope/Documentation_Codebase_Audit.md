# Documentation Codebase Audit

**Started:** 2026-04-30
**Purpose:** Track verification of `documentation/` against the current codebase. Mark each file as it is checked so progress is not lost across context changes.

## Status Legend

- `[ ] Not checked` - File has not been compared yet.
- `[~] In progress` - File is currently being compared.
- `[x] Checked` - File has been compared against the codebase.
- `Needs update` - Documentation does not match the current codebase.
- `Matches` - Documentation is aligned with current codebase evidence.
- `Reference only` - General guidance or research; no exact codebase match required.

## Audit Checklist

### Agent Mindset

- [x] `documentation/agent_mindset/Agent_Mindset.md` - Checked - Matches
- [x] `documentation/agent_mindset/Requirements.md` - Checked - Reference only / implementation differs

### Microservices

- [x] `documentation/microservices/Microservices_Best_Practices.md` - Checked - Reference only / future architecture noted
- [x] `documentation/microservices/Microservices_Insights.md` - Checked - Reference only / future architecture noted

### Non Functional Requirements

- [x] `documentation/non_functional_requirements/Maintainability.md` - Checked - Matches
- [x] `documentation/non_functional_requirements/Performance.md` - Checked - Reference only / current status noted
- [x] `documentation/non_functional_requirements/Scalability.md` - Checked - Reference only / current status noted
- [x] `documentation/non_functional_requirements/Security.md` - Checked - Reference only / current status noted
- [x] `documentation/non_functional_requirements/Usability.md` - Checked - Reference only / current status noted

### Project Scope

- [x] `documentation/project_scope/Coding_Style_Guidelines.md` - Checked - Matches
- [x] `documentation/project_scope/Directory_Structure.md` - Checked - Matches
- [x] `documentation/project_scope/Documentation_Review.md` - Checked - Matches
- [x] `documentation/project_scope/Dynamic_Form_Builder_Implementation_Plan.md` - Checked - Matches
- [x] `documentation/project_scope/Finalized_Technology_Stack.md` - Checked - Matches
- [x] `documentation/project_scope/Forms_ORPC_Error_Handling.md` - Checked - Matches
- [x] `documentation/project_scope/Project_Status.md` - Checked - Matches
- [x] `documentation/project_scope/Project_Summary.md` - Checked - Matches
- [x] `documentation/project_scope/Requirements.md` - Checked - Matches
- [x] `documentation/project_scope/Technology_Stack.md` - Checked - Matches
- [x] `documentation/project_scope/Version_Control_Setup.md` - Checked - Matches / includes recommended `.gitignore` updates

### Technology Research

- [x] `documentation/technology_research/Keycloak_Best_Practices.md` - Checked - Reference only / future auth noted
- [x] `documentation/technology_research/NoSQL_vs_SQL.md` - Checked - Reference only / MongoDB choice noted
- [x] `documentation/technology_research/Redis_and_ElasticSearch_Strategies.md` - Checked - Matches

## Findings

### Repository Evidence Summary

- Workspace/package manager: root `package.json` uses `pnpm@10.33.2` workspaces for `be`, `fe`, and `shared`; `pnpm-workspace.yaml` matches this layout.
- Frontend: `fe/package.json` uses Next `16.2.4`, React `19.2.4`, Vitest, ESLint, and Tailwind 4. `/forms` is implemented at `fe/app/forms/page.tsx` and renders `fe/src/features/forms/FormsPageClient.tsx`.
- Backend: `be/package.json` uses NestJS `^11.1.19`, `@orpc/server`, MikroORM MongoDB, Redis, Elasticsearch, Zod, TypeScript, and Vitest.
- Shared contracts: `shared/forms/form.schema.ts` defines form, field, submission, and answer validation with Zod.
- API shape: backend exposes oRPC at `/rpc` through `be/src/forms/interface/orpc.controller.ts` and `be/src/forms/interface/forms.router.ts`; there are no REST `/api/forms` controllers.
- Persistence/cache/search: MongoDB/MikroORM is wired by `be/src/database/database.module.ts`, Redis by `be/src/infra/external-clients.module.ts` and `be/src/forms/infrastructure/cache/redis-form-cache.ts`, and Elasticsearch by `be/src/forms/infrastructure/search/elastic-form-search-index.ts`.
- Local services: `docker-compose.yml` defines MongoDB, Redis, and Elasticsearch only.
- Git setup: repository has `origin` set to `https://github.com/dang232/TopCV` on branch `main`. `.gitignore` now covers workspace `node_modules`, `dist`, `.next`, coverage, and local env files while allowing `.env.example`.

### `documentation/project_scope/Forms_ORPC_Error_Handling.md` - Checked - Matches

- Evidence: `be/src/forms/domain/errors/form-not-found.ts`, `be/src/forms/interface/forms-orpc-error.mapper.ts`, `be/src/forms/interface/forms.router.ts`, `shared/forms/rpc/forms-orpc-error.contract.ts`, `shared/transport/orpc-common-error-code.ts`, and `fe/src/lib/rpcError.ts`.
- Result: The described DDD error boundary, `FormNotFound` mapping, shared error contract, `/rpc` path, frontend normalization, CORS/origin notes, and explicit `@Inject(...)` Nest note all match the code.

### `documentation/project_scope/Technology_Stack.md` - Checked - Matches

- Evidence: root `package.json`, `be/package.json`, `fe/package.json`, `shared/package.json`, `docker-compose.yml`, `be/src/forms/forms.module.ts`, `fe/app/forms/page.tsx`.
- Result: The documented Next/React, NestJS, oRPC, MongoDB/MikroORM, Redis, Elasticsearch, Zod, Docker Compose, Vitest, typecheck, and ESLint stack matches the current repo.

### `documentation/project_scope/Finalized_Technology_Stack.md` - Checked - Updated - Matches

- Evidence: Nest dependencies live in `be/package.json`, not the repository root; root `package.json` only defines workspaces and scripts.
- Initial mismatch: The backend stack said NestJS dependencies were "at repository root".
- Resolution: Updated the doc to say NestJS dependencies are in `be/package.json`; root manages workspace scripts.

### `documentation/project_scope/Project_Summary.md` - Checked - Updated - Matches

- Evidence: `shared/forms/form.schema.ts` validates field values, and `FormsPageClient.tsx` handles create/list/search/delete/status-toggle/submission flows.
- Initial mismatch: It claimed conditional field display logic based on previous inputs, but no conditional display model or renderer exists in the current schema/UI.
- Resolution: Replaced conditional-display language with implemented dynamic field types, status filtering, search, and submission validation.

### `documentation/project_scope/Project_Status.md` - Checked - Updated - Matches

- Evidence: `package.json` declares `pnpm@10.33.2`; local commands in README use `pnpm`. No Keycloak/auth package or middleware exists in `be/package.json`, `fe/package.json`, or source code.
- Initial mismatch: It documented Keycloak authentication as part of the current stack and used `npm run ...` next-step commands.
- Resolution: Marked Keycloak/auth as future hardening and switched commands to `pnpm services:up`, `pnpm dev:be`, and `pnpm dev:fe`.

### `documentation/project_scope/Dynamic_Form_Builder_Implementation_Plan.md` - Checked - Updated - Matches

- Evidence: `be/` is implemented with NestJS, forms use cases, oRPC routes, MongoDB/MikroORM, Redis, and Elasticsearch. Frontend route lives at `fe/app/forms/page.tsx`.
- Initial mismatch: The plan still treated backend wiring as future work, said Nest dependencies were root-level, and used `npm install` / `npm run dev` under `fe/` instead of workspace `pnpm` commands.
- Resolution: Converted it from future scaffold plan to current implementation notes, including `be/`, `shared/forms`, `/rpc`, and `pnpm` commands.

### `documentation/project_scope/Requirements.md` - Checked - Updated - Matches

- Evidence: code exposes oRPC procedures `forms.create`, `list`, `get`, `update`, `delete`, `search`, `active`, `submit`, and `submissions.list`; there are no REST `/api/forms` routes.
- Initial mismatch: Integration section still said calls reach the Nest API over HTTP "once exposed" and framed controllers/routes generically rather than the implemented oRPC controller.
- Resolution: Updated it to state that the Nest API is exposed through `/rpc`, with shared Zod validation and `FormsRouterFactory` procedures.

### `documentation/project_scope/Directory_Structure.md` - Checked - Updated - Matches

- Evidence: current repo includes `be/`, `fe/`, `shared/`, `docker-compose.yml`, `pnpm-workspace.yaml`, and extra docs such as `Forms_ORPC_Error_Handling.md`, `Project_Status.md`, and this audit file.
- Initial mismatch: The structure was labeled proposed and only listed a subset of `documentation/`; it did not document the actual workspace/source layout.
- Resolution: Replaced it with the current workspace tree and noted generated/build folders should be ignored.

### `documentation/project_scope/Documentation_Review.md` - Checked - Updated - Matches

- Evidence: this audit file now contains the concrete checklist and findings.
- Initial mismatch: The old review doc was a generic process template with placeholder date/team fields.
- Resolution: Updated it to point to `Documentation_Codebase_Audit.md` and describe the concrete review process.

### `documentation/project_scope/Coding_Style_Guidelines.md` - Checked - Updated - Matches

- Evidence: backend uses oRPC and DDD-style modules, not REST controllers; frontend tests use Vitest; no Playwright dependency is configured; no Jest dependency is configured.
- Initial mismatch: It mentioned future `backend`/`api` boundaries, RESTful controller conventions, Playwright, and Nest/Jest in places that did not match the current repo.
- Resolution: Updated it to use `be/`, `fe/`, and `shared/`; documented oRPC adapter conventions; listed Vitest as the configured test runner.

### `documentation/project_scope/Version_Control_Setup.md` - Checked - Updated - Matches

- Evidence: git is already initialized on branch `main` with `origin` set; `.gitignore` covers workspace dependencies, build output, and local env files.
- Initial mismatch: It described first-time setup, `master`, and ignore rules that the actual `.gitignore` did not enforce.
- Resolution: Converted it to current repo Git workflow and updated `.gitignore` for pnpm workspaces.

### `documentation/agent_mindset/Agent_Mindset.md` - Checked - Updated - Matches

- Evidence: API is oRPC, not REST; documentation folder and project have grown beyond the proposed structure.
- Initial mismatch: Several sections were placeholders ("Explain...", "Discuss..."), API design was framed around RESTful principles, and the folder tree was incomplete.
- Resolution: Replaced placeholder prompts with actual decisions: oRPC typed procedures, shared Zod schemas, DDD backend boundaries, CSR frontend, MongoDB/MikroORM, Redis cache, and Elasticsearch search.

### `documentation/agent_mindset/Requirements.md` - Checked - Reference only / implementation differs

- Evidence: `shared/forms/form.schema.ts` supports text, number, date, color, and select fields; submissions are stored through `SubmitFormUseCase`; active forms are sorted by order in `GetActiveFormsUseCase`.
- Implementation difference: The source requirement asks for REST endpoints and standalone field-management endpoints, but the current implementation uses oRPC and updates fields as part of form create/update.
- Resolution: Keep this as original assignment/spec reference; audit status records the implementation difference.

### `documentation/microservices/Microservices_Best_Practices.md` - Checked - Reference only / future architecture

- Evidence: the repo is a pnpm monorepo with one Nest backend module set, one Next frontend, and shared contracts. There is no Kafka/RabbitMQ, service mesh, or database-per-service implementation.
- Result: Treat as general architecture research, not current implementation documentation.

### `documentation/microservices/Microservices_Insights.md` - Checked - Updated - Reference only

- Evidence: no microservice implementation, service mesh, Prometheus, Kubernetes, or multiple service communication layer exists in repo files.
- Initial mismatch: It said insights were gathered during implementation of microservices within this system.
- Resolution: Reframed it as future research/considerations and removed implementation-history claims.

### `documentation/non_functional_requirements/Maintainability.md` - Checked - Updated - Matches

- Evidence: code is modular and tested, but there is no CI configuration found and no module-level README files under `be/`, `fe/src/features`, or `shared/forms`.
- Initial mismatch: It recommended comprehensive README per module/component and CI/CD as if adopted.
- Resolution: Distinguished implemented maintainability practices from target practices.

### `documentation/non_functional_requirements/Performance.md` - Checked - Reference only / partially implemented

- Evidence: Redis caches list/active/by-id reads with TTL; Elasticsearch indexes and searches forms. No background jobs, Kafka, load balancer, CDN, or explicit lazy loading work is present.
- Result: Redis and Elasticsearch sections match directionally; async processing and horizontal scaling sections are future guidance.

### `documentation/non_functional_requirements/Scalability.md` - Checked - Reference only / future architecture

- Evidence: current local Docker Compose starts single-node MongoDB, Redis, and Elasticsearch; no API gateway, sharding, or load-test tooling is configured.
- Result: Treat as future scalability guidance.

### `documentation/non_functional_requirements/Security.md` - Checked - Updated - Reference only

- Evidence: current code has Zod validation, CORS configuration, and oRPC error normalization. There is no auth, MFA, OAuth/OIDC, RBAC, HTTPS config, encryption-at-rest setup, or security event logging implementation.
- Initial mismatch: The doc read like target security posture without marking these items as future work.
- Resolution: Split "implemented today" from "required before production".

### `documentation/non_functional_requirements/Usability.md` - Checked - Reference only / partially implemented

- Evidence: forms UI has user-facing messages and responsive Tailwind layout, but there is no formal WCAG test setup and validation is mostly submit-time rather than real-time inline validation.
- Result: Treat as usability targets; update if it should document current implementation only.

### `documentation/technology_research/Keycloak_Best_Practices.md` - Checked - Reference only / not implemented

- Evidence: no Keycloak package, Docker service, auth middleware, OAuth/OIDC integration, or RBAC code exists.
- Result: Keep as research/future auth guidance; do not describe Keycloak as current project functionality.

### `documentation/technology_research/NoSQL_vs_SQL.md` - Checked - Reference only / MongoDB choice matches

- Evidence: `be/src/database/database.module.ts`, `be/src/database/mikro-orm.config.ts`, and `docker-compose.yml` use MongoDB with MikroORM.
- Result: Research doc is directionally consistent with the chosen persistence approach.

### `documentation/technology_research/Redis_and_ElasticSearch_Strategies.md` - Checked - Updated - Matches

- Evidence: Redis caches form read paths (`forms:list`, `forms:active`, `forms:by-id:*`); Elasticsearch indexes/searches form title, description, status, order, and field labels.
- Initial mismatch: The doc mentioned session caching, submission/user-generated-content search, and event-driven synchronization; current code uses direct use-case updates to cache/search and searches forms, not submissions.
- Resolution: Documented the implemented form metadata cache, direct invalidation on create/update/delete, and form-only Elasticsearch index.

