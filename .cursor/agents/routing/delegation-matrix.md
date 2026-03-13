# Delegation Matrix

| Task Type | Primary Agent | Fallback Agent | Split into Multiple Agents When | Keep Single-Agent When |
|---|---|---|---|---|
| Product clarification | `product-manager` | `planner` | requirements and technical constraints are both unclear | request is small and acceptance is explicit |
| Solution planning | `planner` | `orchestrator` | feature spans FE/BE/DB and has rollout risk | one-file or one-module change |
| External or unknown research | `research-analyst` | domain specialist | independent research questions can run in parallel | one narrow question |
| Frontend implementation | `frontend-developer` | `typescript-specialist` | API contract also changes | API contract is frozen |
| Backend implementation | `backend-developer` | `database-specialist` | DB migration or FE integration is required | API-only internal change |
| Typing and contract hardening | `typescript-specialist` | owning implementer | contracts affect FE and BE together | localized type fix |
| Schema, migration, RLS | `database-specialist` | `backend-developer` | migration needs compatibility sequencing | no schema impact |
| Bug triage and fix | `debugger` | owning specialist | flaky or cross-layer issue | deterministic single-layer defect |
| Code quality review | `code-reviewer` | `orchestrator` | high-risk changes need QA pairing | low-risk documentation-only change |
| QA validation | `qa-tester` | implementer (smoke only) | staging or deploy checks are needed | local behavior smoke test only |
| Release and deployment | `devops-engineer` | `orchestrator` | go/no-go decision requires QA evidence | no deploy impact |
| Documentation | `documentation-writer` | owning specialist | API docs, runbook, and changelog all changed | tiny inline doc adjustment |
