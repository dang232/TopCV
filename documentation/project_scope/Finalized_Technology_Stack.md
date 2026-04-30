# Finalized Technology Stack for Dynamic Form Builder System

## Overview
This document outlines the finalized technology stack chosen for the Dynamic Form Builder System based on project requirements and architectural considerations discussed in previous documentation.

## Frontend Stack:
- **Framework**: **Next.js** (currently **16.2.4**, App Router) with **React** (**19.2.4**).  
  The UI lives under `fe/`. Rendering is intentionally **CSR-first**: interactive screens are built with **React client components**; SSR and SSG are not positioned as the primary delivery mode for this product.

- **State & routing**: **Next.js App Router** (file-system routes, layouts) and **React** patterns (`useState`, context, server actions only where they fit the CSR model)—no separate SPA router dependency.

## Backend Stack:
- **Framework**: **NestJS** (**^11.1.19** `@nestjs/common` / `@nestjs/core` in `be/package.json`).  
  Backend implementation lives under `be/`, with DDD-style `domain`, `application`, `infrastructure`, and `interface` boundaries for forms.

- **Database**: **MongoDB** with **MikroORM** for flexible form definitions and submissions.

- **API Design**: **oRPC** procedures exposed by Nest at `/rpc`, while preserving clear JSON request/response contracts.

- **Cache and Search**: **Redis** is used for form read caching, and **Elasticsearch** indexes forms for search.

## Additional Libraries and Tools:
- **Validation**: **Zod** (**^4.4.1**) for shared schemas under `shared/`; both frontend and backend consume the same contracts.
- **Testing Framework**: **Vitest** for shared, backend, and frontend tests, plus frontend lint/typecheck.
- **Deployment Strategy**: **Docker Compose** for local MongoDB, Redis, and Elasticsearch.
- **Version Control**: **Git** for managing changes and collaborating across the development team.

## Conclusion
This technology stack reflects the versions in use today in the repo: Next.js/React in `fe/`, NestJS/oRPC in `be/`, shared Zod contracts in `shared/`, MongoDB/MikroORM persistence, Redis caching, and Elasticsearch search. CSR remains the guiding frontend posture.

---

*Documented on [date/time], by [Your Name/Team Name].*
