# Skill: Frontend

## Job (what this skill must do)

Implement and fix UI: pages, layouts, components, routing, client state, and accessibility. Deliver correct, accessible, maintainable UI with clear loading, error, and empty states. Use the project design system and API contracts; do not implement API routes or server-only logic.

## What the skill must use

- **Specialist**: `.cursor/agents/specialists/frontend-developer/SKILL.md` — act as **frontend-developer**; use scripts/design system if UI/UX work.
- **Context**: API contracts (response shapes, error codes); design tokens and `components/ui/`; app router and layout.
- **Specialist search**: `python3 .cursor/agents/specialists/frontend-developer/scripts/search.py "<query>"` for the existing frontend UI and design-system search workflow.

## Guidance (invoke when, critical rules, boundaries)

- **Invoke when**: Pages, layouts, components, routing (`app/`, `components/`); user-facing flows; loading/error/empty states; forms; accessibility (a11y); design system or UI consistency; prototypes; mobile/XR/visual interfaces when task is UI.
- **Do not invoke when**: API routes (`app/api/`), server actions with DB logic, schema/migrations/infra.
- **Critical rules**: (1) Prefer Server Components; add `"use client"` only for hooks, events, or browser APIs. (2) Use existing UI primitives first; add new components consistently. (3) Follow project tokens and spacing; avoid ad-hoc style drift. (4) Accessibility: semantic HTML, `aria-*`, keyboard nav, loading/error announcements; WCAG 2.2 AA minimum; test with keyboard and screen reader—automated tools catch ~30%, manual testing catches the rest. (5) API contracts: validate response shapes; handle loading, error, empty; never assume success. (6) Design system: design tokens, 4.5:1 contrast, 44px min touch targets; respect `prefers-reduced-motion`. (7) Run `npm run lint` before handoff.
- **Boundaries**: Do not change API route signatures or backend logic; do not modify deployment/infra. Hand off to backend for API/schema changes.

## When to use this skill

- Task touches views, components, routing, or client state.
- UI behavior, accessibility, or visual consistency is required.
- Acceptance criteria include frontend deliverables.

## Do not use for

- API routes, server actions with DB logic, schema, migrations, infra.

## Output / done

- Frontend code changes (components, pages, hooks).
- Loading/error/empty handling; a11y considerations.
- Notes on contract alignment and manual test steps.

## Handoff

When delegating: "Act as frontend-developer per .cursor/agents/specialists/frontend-developer/SKILL.md. Job and inputs: .cursor/agents/skills/frontend.md. Scope: [files/task]."
