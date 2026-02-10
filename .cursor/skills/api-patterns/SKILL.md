---
name: api-patterns
description: Use for API design: endpoint conventions, error schema, validation, pagination, versioning. Assign to backend-a, frontend (contract sync), security.
version: 1
triggers:
  keywords: ["api", "endpoint", "route", "controller", "validation", "pagination", "error shape"]
  paths: ["server/**", "api/**", "routes/**", "src/app/api/**"]
checklist:
  - Use nouns + HTTP verbs; stable error schema; validate all inputs; paginate lists
anti_patterns:
  - Custom error format per endpoint; leaking stack traces; unbounded list responses
examples: "GET /users?limit=20&offset=0 → { data: [], total, hasMore }; errors → { error: { code, message } }"
---

# API Patterns

Conventions for REST/API layer so all workers produce consistent contracts and error shapes.

## Endpoint conventions

- Use nouns for resources, HTTP verbs for actions. Prefer `GET /resources`, `POST /resources`, `GET /resources/:id`, `PATCH /resources/:id`, `DELETE /resources/:id`.
- Use kebab-case or camelCase consistently for JSON; document in API docs.
- Version via URL prefix (`/v1/...`) or header; avoid breaking changes without version bump.

## Error schema

- Return a stable error shape: e.g. `{ "error": { "code": string, "message": string, "details?: unknown } }`.
- Use HTTP status codes correctly: 4xx client error, 5xx server error.
- Do not leak stack traces or internal paths in production.

## Validation

- Validate and sanitize all inputs (query, body, params). Return 400 with clear validation errors.
- Document required vs optional fields and types in API contract notes.

## Pagination

- Support `limit` and `offset` (or `cursor`) for list endpoints. Default limits; max cap.
- Return metadata: e.g. `total` or `hasMore` so clients can paginate.

## Search prompts

Use these (or similar) semantic search queries to find the right code before changing APIs:

- Where are API routes defined and how are errors returned?
- How is request validation and error shape implemented for endpoints?
- Where is pagination or list response format defined for API routes?

## Output

When changing APIs: note **API contract** (method, path, request/response shape, errors) and **test steps** for the endpoint.
