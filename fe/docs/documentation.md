# Dynamic Form Builder Documentation

## Overview
This documentation covers the integration of the **Next.js frontend** (`fe/`) and **NestJS backend** (`be/`) using **oRPC** and shared contracts from `@topcv/shared`.

## Features
- **Contract-first transport**: request/response shapes are shared via schemas/types in `@topcv/shared`.
- **oRPC communication**: typed client/server RPC to keep FE/BE aligned.
- **Keycloak authentication (required)**: login/register/logout via Keycloak (OIDC), with RBAC (`admin`, `staff`) enforced server-side.

## Setup Instructions
### Environment Setup
1. Install Node.js (prefer project-managed scripts over global installs).

### Installation
1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies using the repo package manager (e.g. `pnpm install` if configured).

## Testing
- **Frontend tests**: colocated near features (e.g. `fe/src/features/**`).
- **Backend tests**: colocated near modules/use-cases (e.g. `be/src/**`).

### Documentation Updates
Keep this doc aligned with:

- **Auth**: Keycloak realm/client settings used by the app, and how FE/BE validate sessions/tokens.
- **RBAC**: which routes/features require `admin` vs `staff`.
- **Transport**: where oRPC routers live on FE and BE, and which parts of `@topcv/shared` are considered stable contracts.