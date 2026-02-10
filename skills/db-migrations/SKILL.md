---
name: db-migrations
description: Use for schema changes, migrations, rollback, data scripts. Assign to backend-b, data.
version: 1
triggers:
  keywords: ["migration", "schema", "db", "rollback", "query", "transaction"]
  paths: ["db/**", "migrations/**", "prisma/**", "src/lib/db/**"]
checklist:
  - One logical change per migration; define rollback; prefer additive changes; idempotent where possible
anti_patterns:
  - Destructive change without rollback; long-running locks; no test on copy
examples: "Add column nullable first; backfill; then add constraint. Document rollback steps."
---

# DB Migrations

Checklist for schema and data changes so migrations are safe and reversible.

## Migration checklist

- One logical change per migration file; name clearly (e.g. `add_user_preferences_table`).
- Prefer additive changes (new columns nullable or with defaults) to avoid long locks.
- For destructive changes (drop column, table): do in separate migration after code has stopped using it; document rollback.

## Rollback

- Every migration must have a defined rollback (script or down migration). Document in migration notes.
- Test rollback on a copy of data when possible.

## Idempotency

- Where supported, make migrations idempotent (e.g. "CREATE TABLE IF NOT EXISTS", "ADD COLUMN IF NOT EXISTS") so re-runs do not fail.

## Zero-downtime patterns

- Add new column as nullable or with default; backfill; then add constraint or switch code.
- Avoid long-running locks; use batched updates for large tables.

## Search prompts

Use these (or similar) semantic search queries before changing schema or data:

- Where are database migrations or schema changes defined?
- How is the database schema or ORM model defined for this entity?
- Where are rollback or down migrations handled?

## Output

Provide: **migration plan** (files/scripts), **rollback steps**, **test data notes** (how to verify), and any **env/feature-flag** needs.
