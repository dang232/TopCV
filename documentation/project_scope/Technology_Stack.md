# Technology Stack

## Frontend
- **Framework**: **Next.js 16** (App Router) and **React 19** (`fe/`)—client-side rendering (CSR) is the primary UX model; App Router is used for structure and navigation, not as a mandate for SSR-first pages.
- **State & UI**: React component state and shared patterns (context where needed).
- **Routing**: Next.js App Router (file-based routes, layouts).

## Backend
- **Framework**: **NestJS 11.x** under `be/`, organized with DDD boundaries for forms.
- **Database**: **MongoDB** through **MikroORM** for document-oriented form and submission storage.
- **API Design**: **oRPC** procedures exposed by the Nest backend at `/rpc`.
- **Cache/Search**: **Redis** caches form reads; **Elasticsearch** indexes forms for search.

## Additional Libraries / Tools
- **Validation**: **Zod** (^4.4.1) shared with the frontend via `shared/` where applicable.
- **Deployment**: Docker Compose for local MongoDB, Redis, and Elasticsearch services.
- **Testing**: Vitest for shared/backend/frontend tests, plus TypeScript typechecks and frontend ESLint.
- **Version Control**: Git for managing codebase changes and collaboration.

---

*Finalized on [date/time], by [Your Name/Team Name].*
