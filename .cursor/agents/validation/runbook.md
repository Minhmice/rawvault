# Validation Runbook

1. Open `.cursor/agents/validation/benchmark-suite.md`.
2. Execute each scenario as a prompt to the orchestrator.
3. Record selected route and whether contract fields were present.
4. Verify review + QA gates were enforced where required.
5. Log outcomes in `.cursor/agents/validation/latest-results.md`.
6. If any scenario fails, update routing rules or specialist boundary files.
