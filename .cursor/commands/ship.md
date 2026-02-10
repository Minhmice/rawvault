# Ship (Orchestrator)

You are acting as the **orchestrator** for this request. The user will provide a `<request>` describing what they want to build or change. Execute the following steps in order.

## Input

- **Request:** (user's description of the work to be done)

## Steps

### 1. Triage

Break the request into **work items** and assign each to a worker type:

- **BE-A (backend-a):** Routes, controllers, auth, validation, error shape, API contracts
- **BE-B (backend-b):** Schema, migrations, query layer, jobs, integrations, caching
- **FE (frontend):** Pages, components, state, client validation, UX
- **QA:** Test plan, tests, regression, definition of done
- **Security:** Quick review (validation, authZ/authN, secrets, deps)
- **Docs:** README, API docs, CHANGELOG, how-to test, migration notes
- **DevOps:** Docker/Compose, env, CI, runbook, deploy

List each work item with its owner (subagent name).

### 2. Routing lookup (ownership + skills + gates)

**Always consult `.cursor/team/routing.yml`.** Do not infer owner or skills from memory.

For each work item:

1. Match by **keywords** (from the work item description) and **paths** (if the user or context suggested files/folders) against each route's `match.keywords` and `match.paths`.
2. Pick the best-matching route (or 2–3 candidate routes if ambiguous; then list them in your output and let the user choose in the same reply).
3. From the chosen route, take: `id`, `owner`, `skills_required`, `skills_suggested`, `gates_required`.

For each work item, output:

- **route id** (e.g. api_endpoint, db_change, ui_feature)
- **owner** (subagent name)
- **skills_required** (mandatory; worker must read these skills)
- **skills_suggested** (optional; worker may use these)
- **gates_required** (qa, security, docs, devops as applicable)

**Artifact:** Right after step 2, write or update **`.cursor/reports/work-items.md`** with the list of work items (id, short description, owner, skills_required, gates_required, status). Use status: Not started | In progress | Done.

When a handoff is created (via `/handoff`), append it to **`.cursor/reports/handoffs.md`** (file paths, owner, change request, reason, test).

### 3. Ownership mapping

For each work item, identify which **files or folders** are involved. Cross-check with routing path patterns and project rules:

- `server/**`, `api/**`, `routes/**`, `src/app/api/**` → **backend-a**
- `db/**`, `migrations/**`, `workers/**` → **backend-b**
- `web/**`, `app/**`, `components/**`, `ui/**`, `src/app/**`, `src/components/**` → **frontend**

If the repo uses a different structure, adapt using the paths defined in routing.yml. Ensure no work item asks a worker to edit outside their ownership without a handoff.

### 4. Delegate

For each work item, **invoke the correct subagent** (e.g. "Use the **backend-a** subagent to implement …"). One work item per delegation. For each work item, state explicitly:

- **Required skills:** (from routing `skills_required`) — worker must read `.cursor/skills/<name>/SKILL.md` for each.
- **Suggested skills:** (from routing `skills_suggested`) — optional.

After each work item is done, **collect output** in the function contract format.

**Function contract (required from every worker):** Scope, Context Discovery (query + files considered), Files changed, Behavior change, Test plan, Risks, Handoff needed? If a handoff is needed, create it with `/handoff` and assign to the owning subagent.

### 5. Collect and gate

Gather all outputs. Then check **quality gates** (see rule 30-quality-gates):

- **QA gate:** Test plan exists and has been run; results documented. No ship without pass.
- **Security gate:** Quick review done; high-risk issues fixed.
- **Docs gate:** At least "how to test" and any config/env change documented.

**If `.cursor/reports/gate-report.md` exists**, read it and treat it as the source of truth for gate status. If it does not exist, run the gate checklist manually. Do not produce `final-report.md` until all gates pass.

If any gate fails, list what is missing and do not mark as shipped until resolved. If any gate is red: create a fix work item (or assign to qa/security/docs), re-run the gate (e.g. run tests again), then re-check gate-report.md.

**Ready to merge when:** All gates green in `.cursor/reports/gate-report.md` and no pending handoffs in `.cursor/reports/handoffs.md`.

### 6. Final report

When all gates pass:

1. Write or update **`.cursor/reports/final-report.md`** with:
   - **Changelog** — What changed (by area or file).
   - **How to test** — Consolidated steps for the user.
   - **Known risks** — Migration, rollback, compatibility, or follow-up items.

2. In your reply, summarize the same for the user.

---

After you complete these steps, the user has a clear list of work items (with route id, owner, skills_required, skills_suggested, gates_required from routing.yml), who did what, and whether the change is ready to ship from a process perspective.
