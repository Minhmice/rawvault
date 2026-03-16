# Task-to-Agent Mapping Rules (Orchestrator)

**Purpose**: Remove ambiguity in how tasks map to agents. Enforce precise routing for backend/frontend paired work and targeted fixes.

**Core rule**: When the orchestrator is called, **ALL selected agents run at the same time (in parallel)**. No sequential chains. Saves time.

**Post-implementation gate (mandatory)**: After implementation agents finish and their output is merged, the orchestrator **must** run **code-reviewer** and **qa-tester** in parallel before declaring the task complete. Do not skip this step unless the user explicitly asks to skip review/QA or the task is non-code.

**Registry agents**: orchestrator, planner, product-manager, research-analyst, frontend-developer, backend-developer, typescript-specialist, database-specialist, google-cli-specialist, debugger, code-reviewer, qa-tester, documentation-writer, devops-engineer

### Execution sequence (for implementation tasks)

1. **Phase 1 — Implement**: Run selected implementation agents in parallel (e.g. frontend-developer + backend-developer). Merge their outputs.
2. **Phase 2 — Review & QA**: Run **code-reviewer** and **qa-tester** in parallel on the merged scope. No exception unless user asks to skip or task is non-code.
3. **Synthesize**: Combine implementation + review + QA; list residual risks; present as complete.

---

## 1. Task Category → Agent Mapping (Deterministic)

| Task Category | Agent 1 | Agent 2 | Parallel? | Notes |
|---------------|---------|---------|-----------|-------|
| **UI bug or design fix** | frontend-developer | backend-developer (only if API dependency) else typescript-specialist | Yes (2) | Default 2 parallel for focused fixes |
| **API bug or service bug** | backend-developer | frontend-developer (only if UI depends on contract) else typescript-specialist | Yes (2) | Default 2 parallel for focused fixes |
| **Full flow bug (UI → API)** | backend-developer | frontend-developer | Yes (2) | Both in parallel |
| **Schema/RLS/data integrity bug** | database-specialist | backend-developer | Yes (2) | DB + backend integration |
| **Contract drift or DTO mismatch** | typescript-specialist | backend-developer OR frontend-developer (where break is) | Yes (2) | TS owns contract; impl follows |
| **Small stabilization pass** | pick 2 closest agents | — | Yes (2) | Minimum 2 agents for stabilization |
| **gws CLI / Google Workspace CLI** | google-cli-specialist | typescript-specialist (if contract) or code-reviewer | Yes (2) if contract/QA; else 1 | Discovery, auth, commands, validation |

---

## 2. Selection Logic (No Ambiguity)

### 2.1 Domain Touch Rules

- **Task touches**: `app/api/**`, `lib/**/service`, `lib/contracts/**`, route handlers, auth, server logic  
  → **Select**: `backend-developer`

- **Task touches**: `app/**/*.tsx`, `components/**`, `pages/**`, layout, design tokens, client state, a11y  
  → **Select**: `frontend-developer`

- **Task touches both** (API + UI in same flow)  
  → **Select**: `backend-developer` + `frontend-developer` in parallel

- **Task touches**: `lib/contracts/**`, DTOs, Zod schemas, type inference, generic types  
  → **Prefer**: `typescript-specialist` as one of the agents (implementation or alignment)

- **Task touches**: schema, migration, RLS, policy, `supabase/migrations/**`, raw SQL  
  → **Prefer**: `database-specialist` as one of the agents

- **Task touches**: gws CLI, `src/discovery.rs`, `src/services.rs`, `src/auth*.rs`, `src/commands.rs`, `src/executor.rs`, `src/validate.rs`, `src/helpers/mod.rs`  
  → **Select**: `google-cli-specialist`

### 2.2 Lane Composition Rules

All agents run **in parallel** (at the same time). Merge owner combines outputs after completion.

| Scope | Agent 1 | Agent 2 | Merge Owner |
|-------|---------|---------|-------------|
| **Backend-only** | backend-developer | typescript-specialist | backend-developer |
| **Frontend-only** | frontend-developer | typescript-specialist OR code-reviewer | frontend-developer |
| **Full flow (FE+BE)** | frontend-developer | backend-developer | orchestrator |
| **Contract-heavy** | typescript-specialist | backend-developer OR frontend-developer | typescript-specialist |
| **DB-heavy** | database-specialist | backend-developer | database-specialist |

---

## 3. Parallel Selection Rules

### When to use 2 agents in parallel (default for focused fixes)

- **Focused fix, UI adjustment, behavior alignment, targeted stabilization** → default to exactly 2 parallel agents.
- Task spans **UI and API** in the same user flow → backend-developer + frontend-developer.
- UI-only fix with no API dependency → frontend-developer + typescript-specialist.
- API-only fix with no UI dependency → backend-developer + typescript-specialist.
- **Condition**: Artifacts are independent; no output of one blocks the other. Merge owner is explicit.

### When to use 3+ agents in parallel

- **Avoid** for small scoped fixes. Do not spawn 4-agent runs.
- Only when: research + planning + implementation are truly independent (e.g. greenfield slice).

### When to use 1 agent (no parallel)

- Single-file change, trivial one-module fix.
- User explicitly requests single agent.

---

## 4. Drift and Ambiguity Fixes

### 4.1 Agent Name Consistency

- **Use registry names only**: `frontend-developer`, `backend-developer`, `typescript-specialist`, `database-specialist`, `google-cli-specialist`, `code-reviewer`, `qa-tester`, `debugger`, `planner`, `product-manager`, `research-analyst`, `documentation-writer`, `devops-engineer`.
- **Do not use**: Frontend Developer, Backend Architect, engineering-senior-developer, EvidenceQA, ArchitectUX, etc. (legacy/alternate names).

### 4.2 Contract-Heavy vs Type-Heavy

- **Contract-heavy**: DTOs, Zod schemas, API request/response shapes, shared types across FE/BE.  
  → `typescript-specialist` primary; FE/BE implement consuming changes.

- **Type-heavy**: Local type errors, inference fixes, generic constraints.  
  → `typescript-specialist` primary; no FE/BE parallel unless contract changes.

### 4.3 Full Flow Bug Clarification

- **Full flow bug**: User action in UI triggers API call; bug manifests in either layer or in handoff.  
  → Always select **both** `frontend-developer` and `backend-developer` in parallel.  
  → Add `typescript-specialist` as alignment if contract/DTO is suspected.

### 4.4 DB vs Backend Boundary

- **database-specialist**: schema, migrations, RLS policies, indexes, raw SQL.
- **backend-developer**: route handlers, service layer, auth checks, calling DB via client.
- **When both**: Run both in parallel when possible (e.g. DB writes migration, backend prepares route structure). Merge after both complete.

---

## 5. Compact Run Format

For every delegated task, use this format. Each agent block must use the exact numbered format:

```markdown
**Goal**: [one-line objective]
**Code scope**: [files/modules touched]

**Parallel agents** (run at the same time):
1) [agent-name]
   Task: [what this agent must achieve]
   Inputs: [docs, diffs, constraints]
   Output required: [exact artifact format]

2) [agent-name]
   Task: [what this agent must achieve]
   Inputs: [docs, diffs, constraints]
   Output required: [exact artifact format]

**Rules**: [task category + lane composition from §1–2]
**Post-implementation gate** (mandatory before completion): Run code-reviewer and qa-tester in parallel on the merged implementation; then synthesize. Final merge only after review + QA.
**Final merge**: [merge owner]
```

For focused fixes, default to exactly 2 parallel agents.

---

## 6. Quick Reference: Task → Agents (2 parallel default)

| User says / Task implies | Agent 1 | Agent 2 |
|--------------------------|---------|---------|
| "Fix button spacing" | frontend-developer | typescript-specialist |
| "API returns 500 on upload" | backend-developer | typescript-specialist |
| "Upload flow broken end-to-end" | backend-developer | frontend-developer |
| "RLS blocks valid access" | database-specialist | backend-developer |
| "DTO doesn't match API response" | typescript-specialist | backend-developer or frontend-developer |
| "Small lint/type cleanup" | owning specialist | code-reviewer |
| "Add gws service" / "Fix gws validation" / "gws discovery bug" | google-cli-specialist | typescript-specialist or code-reviewer |
