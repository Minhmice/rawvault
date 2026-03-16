# .cursor/rules — Consolidated into skills

Rules (`.mdc` files) have been **removed**. Guidance is now in **one skill per field** under `.cursor/agents/skills/`.

- **Field skills**: `.cursor/agents/skills/*.md` (frontend, backend, typescript, database, devops, documentation, qa, code-review, planner, product-manager, research, debugger, google-cli).
- **Orchestrator**: `.cursor/agents/orchestrator/SKILL.md` — routing, delegation, and always-on behavior.

To apply orchestrator behavior in Cursor (e.g. always-on), use Cursor rules/settings to reference the orchestrator SKILL or create a single minimal rule that points to it.
