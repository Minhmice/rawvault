# Handoff

Use this command when a **worker needs changes in files that belong to another owner**. Do not edit outside ownership; create a handoff request instead.

## When to use

- Your task requires editing files in `server/**`, `api/**`, `routes/**` but you are not backend-a.
- Your task requires editing files in `db/**`, `migrations/**`, `workers/**` but you are not backend-b.
- Your task requires editing files in `web/**`, `app/**`, `components/**`, `ui/**` but you are not frontend.

Or whenever the team protocol (rule 00-team-protocol) says: "use `/handoff`".

## Template

Produce a handoff request with **all** of the following:

1. **File paths** — Exact paths that need to be changed (e.g. `api/users/route.ts`, `db/schema.sql`).
2. **Owner (subagent)** — Who owns those paths: `backend-a`, `backend-b`, or `frontend` (or qa/docs/devops/security if they own specific config/docs).
3. **Change request** — What should be done (concrete requirement: add field, change endpoint, fix validation, etc.).
4. **Reason** — Why this handoff is needed (e.g. "FE needs new response field from API").
5. **Test or acceptance** — How the owner can verify the work (e.g. "run GET /api/users and check response has `avatarUrl`").

## Instruction for the owner

The **owner** (subagent) should perform the change **within their ownership** and respond with the standard function contract: Scope, Files changed, Behavior change, Test plan, Risks, Handoff needed?

Do not skip the handoff step when the change crosses ownership boundaries.
