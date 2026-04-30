### Framework Lifecycle Overview for Dynamic Form Builder System

This section covers the lifecycles of the key frameworks used in the dynamic form builder system: **NestJS** and the **Next.js / React** client, and how they integrate.

#### 1. Nest.js Lifecycle
Nest.js is a progressive Node.js framework that is designed around modularity and provides a flexible structure for developing server-side applications. Here’s the typical lifecycle for Nest.js components:

- **Application Initialization**:
  - The Nest application starts by bootstrapping the root module, loading the required modules, and configuring the application instance.
  - Any required configurations (like environmental variables) are set during this phase.

- **Module Loading**:
  - Each module is loaded, and provided services are instantiated according to the dependency injection principles.
  - Modules are a way to group providers, services, and controllers that closely relate to each other.

- **Middleware Execution**:
  - Middleware functions can be applied at the application or module level to intercept requests before they reach the route handlers.
  - Common middleware tasks include logging requests, authentication checks, and data parsing.

- **Route Handlers**:
  - After middleware, the request is processed by route handlers (controllers) specific to the endpoints.
  - Controllers handle incoming requests, process the business logic (possibly involving services), and return the appropriate responses.

- **Exception Handling**:
  - Nest.js provides built-in exception filters. If an error occurs in the application, filters can catch exceptions and handle them gracefully.

- **Response**:
  - The final response is sent back to the client after passing through controllers and interceptors (if defined).

- **Shutdown**:
  - When shutting down, Nest.js allows graceful closing of connections, which should also clean up any resources.

#### 2. Next.js / React client (CSR) at a high level
The UI under `fe/` is built with **React** running in the browser for interactive flows (**CSR-first**). You can think of the client lifecycle in three layers:

- **Module load & root render**:
  - The Next.js bundle loads; the root layout and page tree mount. Client-only behavior belongs in components marked with `'use client'` when using the App Router.

- **Component mount, updates, and cleanup**:
  - **Mount**: After the component’s function runs, **React** commits output to the DOM; **`useEffect`** with an empty dependency array runs after paint—use it for subscriptions, fetches, or DOM integration.
  - **Updates**: State and prop changes trigger re-renders; effects with dependencies re-run when those values change.
  - **Cleanup**: Return a function from **`useEffect`** to remove listeners, abort requests, or clear timers when the effect re-runs or the component unmounts.

- **Navigation**:
  - Client transitions between routes use the App Router’s client navigation; long-lived state may need explicit lifting (context, URL state, or external stores) so it survives route changes as intended.

Do not mirror other frameworks’ legacy lifecycle hooks in React—map lifecycle work to **`useEffect`**, **`useState`**, **`useMemo`/`useCallback`**, and event handlers instead.

#### 3. Integration lifecycle
For the dynamic form builder:

- Calls from React client components reach the Nest API through the oRPC endpoint at `/rpc`.
- `OrpcController` delegates to `FormsRouterFactory`, whose procedures orchestrate application use cases for create/list/get/update/delete/search/active/submit/submission-list flows.
- Application use cases validate with **Zod** schemas shared from `shared/`, then persist through MikroORM/MongoDB and update Redis cache / Elasticsearch search adapters where relevant.
- The client stays in sync via React loading/error state and the typed oRPC client, not by relying on SSR-first page assumptions.

### Conclusion
Understanding Nest’s server lifecycle and React’s render/effect lifecycle is essential for effective development and debugging. Matching server validation with shared Zod schemas keeps the client and API consistent as the Nest service is implemented.
