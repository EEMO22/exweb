---
applyTo: "**"
---

# Development Guidelines for React, Django, and PostgreSQL Project

This document contains the strict rules for our codebase. As an AI assistant, you must follow these rules when generating or modifying code.

## 1. General Principles

- **Separation of Concerns**: Frontend (React) is for UI/UX only. Backend (Django) is for business logic and API only. The database (PostgreSQL) is for data persistence only.
- **Stateless API**: The Django backend must be stateless. Use JWT for authentication. Do not use server-side sessions.
- **Security First**:
  - Backend: Sanitize and validate ALL inputs using DRF Serializers. Use the ORM to prevent SQL injection.
  - Frontend: Sanitize all rendered user-generated content to prevent XSS.
- **Consistency is Key**: Follow the naming and architectural patterns defined below without deviation.

## 2. React (Frontend) Rules

- **Components**: Use **functional components** with Hooks (`useState`, `useEffect`). Avoid class components.
- **Naming**:
  - Components: `PascalCase` (e.g., `UserProfile.js`).
  - Functions & Variables: `camelCase` (e.g., `fetchUserData`).
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`).
- **State Management**:
  - Use `useState` for simple, component-local state.
  - Use **Zustand** for all complex or shared state management. Its structure is similar to Pinia.
- **Styling**: Use **Tailwind CSS v4** for all styling, following a utility-first approach.
- **API Calls**:
  - Centralize API logic in a dedicated service layer (e.g., `/src/services/api.js`).
  - Always use `async/await` syntax.
  - Implement comprehensive `try...catch` error handling for every API request.
- **Tooling**: Enforce **ESLint with Airbnb config** and **Prettier** for all JavaScript/React code.

## 3. Django (Backend) Rules

- **Style**: Strictly follow **PEP 8**. Use the `black` code formatter.
- **Naming**:
  - Models: `PascalCase` (e.g., `UserProfile`).
  - Functions, Methods, Variables: `snake_case` (e.g., `get_active_users`).
- **Architecture**:
  - **Fat Models, Thin Views**: Place business logic in Model methods or a separate service layer, not directly in views.
  - Views should only handle request/response logic.
- **API**:
  - Use **Django REST Framework (DRF)** for all APIs.
  - Use `ModelViewSet` for standard CRUD.
  - Use `Serializers` for robust data validation and serialization.
- **ORM & Queries**:
  - To prevent N+1 problems, always use `select_related` (for foreign keys) and `prefetch_related` (for many-to-many/reverse relations) in querysets that access related objects.
- **Security**:
  - Use environment variables for all secrets (`SECRET_KEY`, `DATABASE_URL`, etc.). **NEVER** hardcode secrets in the code.

## 4. PostgreSQL (Database) Rules

- **Schema Management**: All schema changes **must** be managed through Django Migrations (`makemigrations`, `migrate`). Do not alter the database schema manually.
- **Performance**: Add `db_index=True` to model fields that are frequently used in `filter()`, `exclude()`, or `order_by()` clauses.

## 5. My Instructions for You (AI Assistant)

1.  **Prioritize Official Docs**: Base your suggestions on the official documentation for React, Django, and DRF, and the established best practices mentioned in this file.
2.  **State Uncertainty**: If a user request is ambiguous or a solution has significant trade-offs, you MUST state the uncertainty and present the primary options. Example: "For this task, pattern A is simpler, but pattern B is more scalable. Which do you prefer?"
3.  **Explain Your Code**: When generating a code block, add a brief comment explaining _why_ a particular approach was taken.
4.  **Strict Adherence**: All generated code must strictly follow every rule defined in this document.
