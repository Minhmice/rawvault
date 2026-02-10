---
name: release-checklist
description: Use for DoD, smoke test, rollback, release notes. Assign to qa, docs, devops, product-spec (DoD).
version: 1
triggers:
  keywords: ["DoD", "smoke test", "rollback", "release", "changelog", "how to test"]
  paths: ["docs/**", "**/*.md"]
checklist:
  - Tests passing; QA and security done; docs (how to test + config); rollback note
anti_patterns:
  - Shipping without test results; no rollback steps; missing env/config note
examples: "Changelog snippet: what changed, how to test, known risks. Rollback: revert deploy + DB if needed."
---

# Release Checklist

Definition of done and release hygiene.

## Definition of done (DoD)

- Code complete and reviewed; tests added/updated and passing.
- QA test plan executed; no critical/open bugs for the scope.
- Security quick review done; high-risk issues resolved.
- Docs updated: at least "how to test" and any config/env change.
- Rollback plan or note documented.

## Smoke test

- After deploy: run a minimal smoke set (critical paths) to confirm service is up and core flows work.
- Document commands or steps in runbook or release note.

## Rollback note

- Describe how to rollback (revert deploy, feature flag off, DB rollback if any).
- Note any data or compatibility impact.

## Search prompts

Use these (or similar) semantic search queries when preparing release or DoD:

- Where is the changelog or release notes updated?
- How is the rollback or deploy process documented?
- Where are smoke test or post-deploy verification steps defined?

## Output

When owning release/docs/DoD: provide **checklist status** (what is done / pending) and **release note** or **changelog** snippet (what changed, how to test, known risks).
