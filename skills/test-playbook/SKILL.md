---
name: test-playbook
description: Use for test strategy, writing tests, fixtures, CI. Assign to qa, frontend (frontend tests).
version: 1
triggers:
  keywords: ["test", "unit", "e2e", "fixture", "regression", "DoD"]
  paths: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**", "e2e/**"]
checklist:
  - Describe behavior in test names; use fixtures; fail build on failure; DoD before ship
anti_patterns:
  - it('works'); hardcoded duplication; skipping flaky tests without ticket
examples: "it('returns 400 when email is missing'); npm test / npm run e2e in CI."
---

# Test Playbook

Strategy and conventions for unit, integration, and e2e tests.

## Strategy

- **Unit:** Pure logic, utils, isolated components; fast, no I/O.
- **Integration:** API + DB or services together; use test DB or mocks as agreed.
- **E2E:** Critical user flows only; keep stable and maintainable.

## Naming

- Describe behavior: `it('returns 400 when email is missing')` not `it('works')`.
- Group by feature or module; one describe per file or logical block.

## Fixtures and data

- Use shared fixtures/factories for entities; avoid hardcoded duplication.
- Prefer deterministic data; isolate tests so order does not matter.

## CI

- Run unit on every commit; integration/e2e as agreed (per PR or main).
- Fail the build on test failure; do not skip flaky tests without a ticket to fix.

## Search prompts

Use these (or similar) semantic search queries before adding or changing tests:

- Where are unit tests or test files for this module or component?
- How are test fixtures or mocks set up for API or DB?
- Where are e2e or integration tests defined for this flow?

## Output

Provide: **test plan** (what is covered), **commands to run** (e.g. `npm test`, `npm run e2e`), and **definition of done** for the change (what must pass before ship).
