# Skillmap

**Read `.cursor/team/routing.yml`** and print the **task type (route id) → owner → skills_required → skills_suggested → gates_required** mapping so the team keeps consistent assignment when using `/ship` or delegating work.

If the file cannot be read (e.g. missing or invalid), use the fallback table below.

## Instruction

1. Open or read `.cursor/team/routing.yml`.
2. For each entry in `routes`, output a row: **route id** | **owner** | **skills_required** | **skills_suggested** | **gates_required**.
3. Include a short note that ownership globs are in the rules (10-backend-a-ownership, 11-backend-b-ownership, 20-frontend-ownership) and path patterns are in routing.yml under `match.paths`.

## Fallback (if routing.yml unavailable)

| Route id       | Owner       | skills_required                                    | skills_suggested | gates_required    |
|----------------|-------------|----------------------------------------------------|------------------|-------------------|
| api_endpoint   | backend-a   | api-patterns, logging-observability, security-audit | —                | qa, security, docs |
| db_change      | backend-b   | db-migrations, performance, logging-observability | —                | qa, docs          |
| ui_feature     | frontend    | ui-patterns, test-playbook                        | api-patterns     | qa, docs          |
| qa             | qa         | test-playbook, release-checklist                  | —                | qa, docs          |
| security       | security   | security-audit, api-patterns                       | —                | security, docs    |
| docs           | docs       | release-checklist, api-patterns                  | —                | docs              |
| devops         | devops     | release-checklist, logging-observability          | —                | docs, devops      |
| refactor       | refactor   | performance, api-patterns, ui-patterns            | —                | qa, docs          |
| product_spec   | product-spec | release-checklist                              | —                | docs              |
| data           | data       | db-migrations, logging-observability             | —                | qa, docs          |

## Ownership (globs, from rules)

- **backend-a:** `server/**`, `api/**`, `routes/**`, `src/app/api/**`
- **backend-b:** `db/**`, `migrations/**`, `workers/**`
- **frontend:** `web/**`, `app/**`, `components/**`, `ui/**`, `src/app/**`, `src/components/**`

Use this map when triaging a request and when assigning skills to each work item. Inject only **skills_required** as mandatory; list **skills_suggested** as optional for the work item.
