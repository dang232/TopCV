# Forms module: oRPC error handling (DDD / Clean Architecture)

This document describes how failures flow from the **domain** through **application** use cases to **oRPC** responses and the **Next.js** client, without mixing HTTP/RPC concerns into domain logic.

## Layers and responsibilities

| Layer | Responsibility | Examples |
|--------|-----------------|----------|
| **Domain** | Invariants and domain-specific failures (no status codes, no oRPC). | `FormNotFound` |
| **Application** | Orchestration; throws domain failures when business rules fail. | `GetFormUseCase`, `UpdateFormUseCase`, `SubmitFormUseCase` |
| **Interface (adapter)** | Map failures to wire format; log unexpected errors. | `forms-orpc-error.mapper.ts`, `FormsRouterFactory.runProcedure` |
| **Shared transport contract** | Typed `.errors()` payloads for oRPC (Zod + codes). | `shared/forms/rpc/forms-orpc-error.contract.ts` |
| **Shared cross-cutting codes** | Stable strings shared by multiple bounded contexts (UI hints). | `shared/transport/orpc-common-error-code.ts` |
| **Frontend (presentation)** | Normalize thrown `ORPCError` into a small value object for UI. | `fe/src/lib/rpcError.ts` (`ApiRpcFailure`) |

Dependency rule: **domain** does not reference application, shared RPC contracts, or Nest/oRPC. **Application** references domain (and ports). **Interface** references application + shared contracts + `@orpc/server`.

## Key files

- **Domain error:** `be/src/forms/domain/errors/form-not-found.ts` — `FormNotFound` carries `formId` only.
- **Mapper:** `be/src/forms/interface/forms-orpc-error.mapper.ts`
  - `mapFormsFailureToOrpc` — `FormNotFound` → `ORPCError` with `FormsOrpcErrorCode.FormNotFound`, HTTP 404, `defined: true`, structured `data`.
  - `mapUnhandledFormsProcedureFailure` — logs and returns `OrpcCommonErrorCode.InternalServerError`; in non-production, exposes detail and sets `defined: true`; in production, generic message and `defined: false`.
- **Router:** `be/src/forms/interface/forms.router.ts` — wraps each procedure in `runProcedure`, which delegates to the mapper functions.
- **Procedure error contract:** `shared/forms/rpc/forms-orpc-error.contract.ts` — `formsProcedureFormLookupErrors` attached via `.errors(...)` on procedures that can return “form missing” (`get`, `update`, `submit`).
- **Common ORPC code:** `shared/transport/orpc-common-error-code.ts` — `OrpcCommonErrorCode.InternalServerError`.
- **Client:** `fe/src/lib/rpcError.ts` — `ApiRpcFailure.parse(cause)`; `suggestsInfrastructureHint()` uses **code + status + `defined`**, not substring checks on `message`.

## Wire shape (oRPC)

Clients receive JSON errors compatible with oRPC (`defined`, `code`, `status`, `message`, optional `data`). Declared procedure errors for form lookup share payload schema `FormNotFoundOrpcPayloadSchema` (`resource: 'form'`, `id`).

## Environment and local development

- **Backend:** Default Nest HTTP port is typically **3000** (see `be/src/main.ts` if customized). Load `.env` from `be/` (`dotenv`).
- **Frontend:** `pnpm --filter my-app dev` runs Next on **3001** (`next dev -p 3001`).
- **RPC URL:** Set `NEXT_PUBLIC_ORPC_URL` (e.g. `http://localhost:3000/rpc`) in `fe/.env.local`. Default in code falls back to `http://localhost:3000/rpc`.
- **Infrastructure:** MongoDB, Redis, Elasticsearch — use `pnpm services:up` at repo root when required.

## NestJS + `tsx` note

Dev uses `tsx watch`, which does not emit TypeScript decorator metadata used by Nest for implicit constructor injection. Providers that take class dependencies **without** `@Inject(SomeClass)` can receive `undefined`. Use explicit `@Inject(...)` on constructor parameters (see `FormsRouterFactory` and `AppController`).

## Adding a new domain failure

1. Add a domain type/class under `be/src/forms/domain/errors/` (no ORPC imports).
2. Throw it from the relevant use case(s).
3. Extend `mapFormsFailureToOrpc` to map it to `ORPCError` with the correct code, status, and optional `data`.
4. If the error is part of the public RPC contract, add Zod `data` + entry under `shared/forms/rpc/forms-orpc-error.contract.ts` and attach `.errors(...)` on the affected procedures in `forms.router.ts`.

## Related scripts (repo root)

```bash
pnpm dev:be    # Backend dev (tsx watch)
pnpm dev:fe    # Frontend dev (Next on 3001)
pnpm --filter be build
pnpm --filter my-app build
pnpm services:up
```
