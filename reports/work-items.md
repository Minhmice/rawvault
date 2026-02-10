# Work Items

Orchestrator write after triage + routing (step 1–2 of `/ship`). Update status as work completes.

**Request:** Ship RawVault MVP (PRD v1.1) — Drive-lite for RAW photos: auth, folders, upload, preview pipeline, viewer, share links, trash.

**Task documents (3 file MD):**

| Owner      | Task file |
|-----------|-----------|
| backend-a | `.cursor/reports/task-backend-a-rawvault-mvp.md` — API, auth, validation, error shape, upload/sign, files CRUD, signed-url, jobs/run, share |
| backend-b | `.cursor/reports/task-backend-b-rawvault-mvp.md` — Schema, migrations, RLS, storage buckets, preview pipeline (jobs + processor) |
| frontend  | `.cursor/reports/task-frontend-rawvault-mvp.md` — Layout, grid/list, upload UX, viewer, share UX, a11y, skeleton, empty state |

## Triage + routing

| Id | Work item (short) | Route id | Owner | skills_required | skills_suggested | gates_required | Status |
|----|-------------------|----------|-------|-----------------|------------------|----------------|--------|
| 1 | Schema + migrations: folders, files, preview_jobs + RLS | db_change | backend-b | db-migrations, performance, logging-observability | — | qa, docs | Not started |
| 2 | API: upload/sign, files CRUD, signed-url, jobs/run, share | api_endpoint | backend-a | api-patterns, logging-observability | security-audit | qa, security, docs | Not started |
| 3 | Preview job processor (Edge/worker) | db_change | backend-b | db-migrations, performance, logging-observability | — | qa, docs | Not started |
| 4 | Storage buckets + policies (Supabase) | db_change | backend-b | db-migrations, logging-observability | — | qa, docs | Not started |
| 5 | Frontend: auth, layout, drive grid/list, upload, viewer, share UX | ui_feature | frontend | ui-patterns, test-playbook | api-patterns | qa, docs | Not started |
| 6 | QA: test plan, DoD, run tests | qa | qa | test-playbook, release-checklist | — | qa, docs | Not started |
| 7 | Security: validation, RLS, rate limit, secrets | security | security | security-audit, api-patterns | — | security, docs | Not started |
| 8 | Docs: README, how to test, env | docs | docs | release-checklist, api-patterns | — | docs | Not started |
| 9 | DevOps: env template, Supabase setup | devops | devops | release-checklist, logging-observability | — | docs, devops | Not started |

- **Status:** Not started | In progress | Done
- Handoffs: see `.cursor/reports/handoffs.md` when a worker needs another owner to change files.
