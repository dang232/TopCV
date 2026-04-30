# Directory Structure for Dynamic Form Builder System

## Overview
The project is a pnpm workspace with three source packages (`be`, `fe`, and `shared`) plus documentation. This layout reflects the current repository structure and the implemented dynamic form builder vertical slice.

## Directory Layout
```
/
├── be/                                  // NestJS backend package
│   ├── src/
│   │   ├── database/                    // MikroORM/MongoDB setup
│   │   ├── forms/                       // Forms bounded context
│   │   │   ├── domain/                  // Domain model and domain errors
│   │   │   ├── application/             // Use cases, ports, DTO mapping
│   │   │   ├── infrastructure/          // Persistence, Redis cache, Elasticsearch search
│   │   │   └── interface/               // oRPC controller/router/error mapping
│   │   ├── health/                      // Health endpoint module
│   │   └── infra/                       // External clients
│   └── package.json
├── fe/                                  // Next.js frontend package
│   ├── app/                             // App Router pages/layouts
│   ├── src/features/forms/              // Forms UI and API wrapper
│   ├── src/lib/                         // oRPC client and RPC error helpers
│   └── package.json
├── shared/                              // Shared TypeScript/Zod contracts
│   ├── forms/                           // Form schemas, enums, RPC error contracts
│   ├── transport/                       // Cross-context transport constants
│   └── package.json
├── documentation/                       // Project docs, research, and audit tracking
├── docker-compose.yml                   // Local MongoDB, Redis, Elasticsearch
├── package.json                         // Root pnpm workspace scripts
└── pnpm-workspace.yaml
```

## Best Practices
- Keep source code in the workspace package that owns the runtime concern: backend in `be/`, frontend in `fe/`, shared contracts in `shared/`.
- Keep generated output and dependencies out of source review (`node_modules/`, `dist/`, build caches, and local env files).
- Regularly update the documentation to reflect any architectural or functional changes made during development.
- Maintain consistent naming conventions to ensure clarity in code structure and documentation.

---

*Finalized on [date/time], by [Your Name/Team Name].*