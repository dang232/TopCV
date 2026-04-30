# Agent Mindset Document

## Introduction
This document serves as a foundational reflection on the development process for the Dynamic Form Builder System. It encapsulates the thought process behind architecture decisions, validation strategies, API design, and overall project management. 

## Project Overview

### 1. Dynamic Form Builder Purpose
- Provide a configurable forms workflow where admins can create forms and employees can submit answers without hardcoding each form shape.
- Support flexible data collection while keeping validation, storage, and UI behavior consistent across the frontend and backend.

### 2. Goals of Implementation  
- Flexibility: dynamic field metadata supports text, number, date, color, and select fields.
- Validation: shared Zod schemas in `shared/forms/` are consumed by both `fe/` and `be/`.
- Maintainability: the backend forms module follows domain/application/infrastructure/interface boundaries.
- User interface: the CSR `/forms` page supports create, list, search, status toggle, delete, submit, and submission-list interactions.

## Design Considerations

### 1. Data Representation
- Form definitions and submissions are document-oriented and persisted through MongoDB/MikroORM.
- Shared DTO schemas keep document shape changes explicit and testable.

### 2. Modular Design
- Backend boundaries isolate domain rules from persistence, Redis, Elasticsearch, and oRPC transport concerns.
- Frontend form UI is split into feature components under `fe/src/features/forms/`.

### 3. Validation Approach
- The frontend validates create-form input before sending requests.
- Backend use cases parse shared Zod schemas and validate submissions against each form's field definitions, so server-side validation remains authoritative.

## API Design Philosophy

### 1. Typed RPC Contracts
- The current API uses **oRPC** at `/rpc`, not REST controllers.
- Procedures expose form create/list/get/update/delete/search/active/submit and submission-list flows while preserving typed request/response contracts.

### 2. Error Handling
- Domain/application failures stay transport-agnostic.
- Interface mappers convert known failures such as `FormNotFound` into stable oRPC error codes.
- The frontend normalizes oRPC failures through `ApiRpcFailure` before showing user-facing messages.

## Folder Structure Overview
Current high-level folder structure:

- `be/` - NestJS backend with forms DDD boundaries and oRPC interface code.
- `fe/` - Next.js frontend with the `/forms` CSR experience.
- `shared/` - shared Zod contracts and transport constants.
- `documentation/` - project docs, requirements, non-functional guidance, research, and audit tracking.

## Implementation Roadmap
- Keep documentation aligned with the implemented pnpm workspace.
- Continue improving multi-field editing, submission review, auth, observability, and production hardening.

---