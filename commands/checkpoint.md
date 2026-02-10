# Checkpoint

Use this command **mid-stream** to get a status update on the current work: what is done, what is pending, and what gates are still open.

## What to do

1. **Read artifacts** — Open **`.cursor/reports/work-items.md`** and **`.cursor/reports/handoffs.md`** (and **`.cursor/reports/gate-report.md`** if present). Use them as the source of truth for status.

2. **Work items** — From work-items.md or the last `/ship` triage, list each work item. For each, state:
   - **Done** — Completed; output collected in function contract form.
   - **In progress** — Currently assigned or being worked on.
   - **Not started** — Not yet delegated.
   - Update work-items.md if you change status.

3. **Pending handoffs** — From handoffs.md, list any handoff requests not yet fulfilled (file paths, owner, change request). Remind which subagent must act on each.

4. **Gates** — From **gate-report.md** (if present), report the current gate status. List which gates are **not yet green**:
   - **QA:** Test plan + results — done or pending?
   - **Security:** Quick review — done or pending? Any high-risk open?
   - **Docs:** How to test + config/env note — done or pending?
   - If gate-report.md is missing, remind the three quality gates (rule 30-quality-gates) and note that the stop hook will populate gate-report.md when the agent loop ends.

5. **Next steps** — Suggest the next action: e.g. "Delegate work item X to backend-b", "Complete handoff for api/users/route.ts", "Run QA test plan and record results", or "Re-run gate and check gate-report.md."

**Ready to merge when:** All gates green in gate-report.md and no pending handoffs in handoffs.md. Keep the checkpoint concise so the user can see at a glance where things stand and what to do next.
