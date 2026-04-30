# Updated Coding Style Guidelines for Dynamic Form Builder System

## Overview
This document serves as a guideline for coding practices to be followed in the Dynamic Form Builder project. Establishing a consistent coding style that adheres to **Domain-Driven Design (DDD)** and **Clean Code** principles, while following the **DRY (Don't Repeat Yourself)** principle, is essential for maintainability, readability, and collaborative development.

## General Guidelines
1. **File Structure**:
   - Organize files into meaningful directories reflecting domain boundaries and responsibilities (for example, `be/src/forms/domain`, `be/src/forms/application`, `be/src/forms/infrastructure`, `be/src/forms/interface`, `fe/app`, `fe/src/features`, and `shared/forms`).
   
2. **Naming Conventions**:
   - **Entities**: Use `PascalCase` for entity names (e.g., `Form`, `User`).
   - **Value Objects**: Use `CamelCase` for value objects (e.g., `FormField`, `UserCredentials`).
   - **Services**: Begin with a verb for service class names (e.g., `FormService`, `UserService`).

3. **DRY Principle**:
   - Avoid repeating logic and common code across the application. Extract common functionality into reusable modules or services.
   
4. **Commenting**:
   - Use comments to describe complex logic or important sections of code. Favor descriptive function and variable names over comments.
   - Utilize `//` for single-line comments and `/* ... */` for multi-line comments.

5. **Indentation and Spacing**:
   - Use 2 spaces for indentation. No tabs.
   - Ensure there is a space after commas and around operators.

6. **Code Formatting**:
   - Follow consistent formatting practices throughout the codebase. Consider using a code formatter like Prettier for automatic formatting.

## Clean Code Practices
1. **Readable Code**: Focus on writing code that clearly expresses its intent. Use descriptive names and structure the code for easy comprehension.
2. **Single Responsibility Principle**: Each module or class should have one reason to change, adhering to the principles of DDD.
3. **Testing**: Write unit and integration tests to validate domain logic, ensuring inputs produce expected outputs. Use testing frameworks that integrate well with the chosen tech stack.

## Specific Framework Guidelines
### Next.js / React (`fe/`)
- Prefer **CSR** (`'use client'` where interactivity requires it); keep Server Components defaults in mind only when you deliberately want server-rendered markup.
- Co-locate feature UI with the App Router: `app/` routes, layouts, and small leaf components rather than oversized pages.
- Favor hooks (`useState`, `useEffect`, context) over ad-hoc globals; extract reusable presentation into stable child components.

### Nest.js / oRPC (`be/`)
- **Domain model**: Keep invariants and domain-specific failures free of Nest, oRPC, and HTTP concerns.
- **Application use cases**: Orchestrate validation, repositories, cache/search ports, and domain failures.
- **Interface adapters**: Expose typed oRPC procedures and map errors to transport-safe shapes in files such as `forms.router.ts` and `forms-orpc-error.mapper.ts`.
- **Dependency injection**: Use explicit `@Inject(...)` on constructor dependencies when needed by the `tsx watch` dev runtime.

### Linting and Testing Tools
- **Linting**: Use **ESLint** and **typescript-eslint** for identifying issues and maintaining coding standards.
  - **ESLint**: [eslint.org](https://eslint.org/)
  - **typescript-eslint**: [typescript-eslint.com](https://typescript-eslint.com/)
- **Testing**: Leverage **Vitest** for shared, backend, and frontend tests. Add browser/E2E tooling such as Playwright only when the project config includes it.
  - **Vitest**: [vitest.dev](https://vitest.dev/)
  - **Playwright**: [playwright.dev](https://playwright.dev/)

## Conclusion
Establishing and adhering to these coding style guidelines, along with DDD principles, clean coding practices, and the DRY principle, will streamline development efforts and improve code quality. These practices will foster a sustainable and scalable project environment.

---

*Documented on [date/time], by [Your Name/Team Name].*
