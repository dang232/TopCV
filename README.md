# Dynamic Form Builder Project

## Overview
This project implements a dynamic form builder system using **Next.js** and **React** on the frontend (CSR-first), **NestJS** on the backend, **oRPC** for typed client/server calls, **MongoDB + MikroORM** for persistence, **Redis** for read caching, **Elasticsearch** for form search, and shared **Zod** contracts.

## Features
- **Dynamic Forms**: Build, list, update, delete, search, activate, and submit forms.
- **Type Safety**: TypeScript plus **Zod** (`shared/`) to reduce runtime errors across client and API layers.
- **DDD Backend**: Nest modules keep domain, application, infrastructure, and interface code separated.
- **Accessibility**: Aim for WCAG-aligned forms wherever possible.

## Getting Started
### Prerequisites
- Node.js (LTS recommended, e.g. 20+)
- pnpm 10+
- Docker, for local MongoDB, Redis, and Elasticsearch services

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dang232/TopCV.git
   cd TopCV
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start local services:
   ```bash
   pnpm services:up
   ```
4. Run the backend and frontend in separate terminals:
   ```bash
   pnpm dev:be
   pnpm dev:fe
   ```
5. Open the CSR form builder:
   ```text
   http://localhost:3001/forms
   ```

## Verification
```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Technologies Used
- **Frontend** (`fe/`): **Next.js 16.2.4**, **React 19.2.4**, **TypeScript**—**client-side rendering** is the primary mode for the builder experience.
- **Shared** (`shared/`): **Zod ^4.4.1** contracts for forms, submissions, and user schema.
- **Backend** (`be/`): **NestJS ^11.1.19** with DDD-style form modules and **oRPC** endpoint at `/rpc`.
- **Database/Search/Cache**: **MongoDB + MikroORM**, **Redis**, and **Elasticsearch** via `docker-compose.yml`.

## Documentation
Further documentation lives under `documentation/`. For coding standards, see **Coding Style Guidelines** in `documentation/project_scope/`. For forms **oRPC errors**, layering, and env vars, see **Forms_ORPC_Error_Handling.md** in the same folder.

## Contribution
Contributions are welcome. Fork the project and open a pull request; follow the coding style guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Documented on [current date], by [Your Name/Team Name].*
