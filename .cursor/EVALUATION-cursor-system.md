# Evaluation: Cursor System (What Was Done and How It Looks)

**Date**: 2026-03-16  
**Scope**: All work from `.cursor/PLAN-cursor-system-english-sync.md`, `.cursor/PLAN-cursor-next-steps.md`, and the Phase 4 / Phase 5 plan docs.

---

## 1. What Was Done (Summary)

### Main plan (PLAN-cursor-system-english-sync.md)

| Phase | Status | What was done |
|-------|--------|----------------|
| **Phase 1** | Done | USAGE-GUIDE rewritten in English (overview, rules, orchestrator vs specialist, Prompt → Agent table, workflow, folders, reuse). |
| **Phase 2** | Done | Registry: added `google-cli-specialist`. Replaced `codebase-maintainer` with `documentation-writer` in SKILL and agents-orchestrator rule. Routing: added `google-cli-specialist` signals. Created `mcp.json.example` with placeholder key. |
| **Phase 3** | Done | Deleted 12 one-off handoffs from `orchestrator/handoffs/`. Added `handoffs/README.md` pointing to template and `docs/`. |
| **Phase 4** | Done | Extended `always-orchestrator-skill.mdc` with “Find the Right Agent + Skill” (classify → implement via mcp_task or suggest agent). USAGE-GUIDE §3.4: “When you start a chat, describe your problem…” |
| **Phase 5** | Done | Confirmed all .cursor content in English; registry and routing in sync; `.cursor/README.md` created with Contents, Orchestrator/agent fit, Where to read more, MCP. |

### Next-steps plan (PLAN-cursor-next-steps.md)

| Phase | Status | What was done |
|-------|--------|----------------|
| **Phase 1** | Done | `.cursor/mcp.json` added to `.gitignore`. Root README: “Cursor / MCP” subsection with link to .cursor/README and “do not commit mcp.json”. |
| **Phase 2** | Manual | Benchmark suite run is left to you (runbook + benchmark-suite.md). latest-results.md note added that next-steps was implemented. |
| **Phase 3** | Done | handoffs/README updated with explicit `docs/execution-plans/` and `docs/scope/`. Created `docs/execution-plans/README.md` and `docs/scope/README.md` with purpose and naming. |
| **Phase 4** | On-demand | Checklist for adding a specialist or rule (no implementation). |

### Standalone phase plans

- **PLAN-phase4-auto-agent-skill-fit.md** — Plan for Phase 4; marked implemented.
- **PLAN-phase5-final-consistency.md** — Plan for Phase 5; marked implemented.
- **PLAN-next-phase.md** — Plan for what to do after next-steps (validation run, optional doc consolidation, optional next product slice).

---

## 2. Current State (Read of the System)

### .cursor layout

- **agents/** — Orchestrator SKILL, task-to-agent-mapping-rules, handoff-template, specialists (frontend, backend, typescript, database, code-reviewer, qa-tester, google-cli, etc.), routing (rules.yaml, delegation-matrix), shared (contract, templates, checklists), validation (runbook, benchmark-suite, latest-results), compat (external-skill-map, conflict-resolution). Registry lists 14 agents including google-cli-specialist; no codebase-maintainer.
- **rules/** — always-orchestrator-skill (alwaysApply: true), agents-orchestrator, frontend-developer, backend-developer, plus many other .mdc rules. Project-critical: orchestrator always on, agent/skill fit on chat.
- **handoffs/** — Only README.md (and currently one extra file; see “Gaps” below). README points to parent handoff-template and to docs/execution-plans and docs/scope.
- **README.md** — Single entry point: contents, orchestrator/agent fit, where to read more, MCP. English.
- **mcp.json.example** — Placeholder key; no secret in repo. MCP steps in README.

### docs/

- **docs/execution-plans/** — README explains purpose and naming; folder is the canonical place for new execution plans.
- **docs/scope/** — README explains purpose and naming; folder is the canonical place for new scope docs.
- Existing docs (PLAN-remediation-execution, QA reports, audits, etc.) remain in docs/ root; no forced move.

### Root project

- **.gitignore** — Contains `.cursor/mcp.json` so local MCP keys are not committed.
- **README.md** — Contains “Cursor / MCP” subsection linking to .cursor/README and warning not to commit mcp.json.

---

## 3. Evaluation

### Strengths

1. **Single source of truth** — Orchestrator behavior lives in SKILL; rules point to it. Registry, routing, and SKILL agree (google-cli-specialist present; codebase-maintainer removed).
2. **English-only** — USAGE-GUIDE, always-orchestrator-skill, agents-orchestrator, .cursor/README, and phase plans are in English. Easier for contributors and for model behavior.
3. **Agent/skill fit on chat** — Always-on rule tells the model to classify the user’s problem and either run the orchestrator (mcp_task + Phase 2 gate) or suggest the right agent/skill. USAGE-GUIDE states this in §3.4.
4. **Handoff discipline** — One-off handoffs removed from .cursor; template + handoffs/README only. New plans and scope go to docs/execution-plans and docs/scope, with READMEs and naming guidance.
5. **Security** — mcp.json in .gitignore; mcp.json.example with placeholder; MCP steps documented in .cursor/README and root README.
6. **Discoverability** — .cursor/README is the entry point; root README points to it for Cursor/MCP. Clear “where to read more” links.

### Gaps / Risks

1. **Stray file in handoffs/** — **Fixed.** `phase7-metadata-execution-plan.md` was moved to `docs/execution-plans/phase7-metadata-execution-plan.md` and removed from handoffs/. handoffs/ now contains only README.md.
2. **Phase 2 validation not run** — Benchmark suite (6 scenarios) has not been executed and recorded in latest-results since the sync. **Recommendation**: Run per `.cursor/agents/validation/runbook.md` when convenient and update latest-results.md.
3. **Plan file count** — Five plan files in .cursor (PLAN-cursor-system-english-sync, PLAN-cursor-next-steps, PLAN-next-phase, PLAN-phase4-auto-agent-skill-fit, PLAN-phase5-final-consistency). Fine for traceability; if it feels like clutter, you could add a short index in .cursor/README or a single PLAN-INDEX.md that lists them and when to use each.

### What’s in good shape

- Registry and routing are aligned; no dangling agent names.
- Orchestrator is always on; no need to @ the SKILL.
- New scope/plans have a clear home (docs/execution-plans, docs/scope).
- MCP setup is documented and safe (no committed key).
- Phase 4 and Phase 5 of the main plan are implemented and documented in their own plan files.

---

## 4. Verdict

The Cursor system is **implemented and consistent** for the scope of the main plan and next-steps (Phases 1 and 3). Remaining work is **optional or manual**: run the benchmark suite (Phase 2 of next-steps), and optionally add a plan index. (The stray handoff file was moved to docs/execution-plans/ and removed from handoffs/.) Phase 5 is fully in place: English, sync check, and .cursor/README.md are done. Overall the setup is **usable, syncable, and ready for “describe your problem in chat” to drive the right agent/skill or orchestrator flow.
