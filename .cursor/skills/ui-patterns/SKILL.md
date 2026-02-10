---
name: ui-patterns
description: Use for UI/UX: component conventions, state/error/loading, accessibility. Assign to frontend, refactor.
version: 1
triggers:
  keywords: ["ui", "component", "page", "layout", "loading", "error state", "a11y"]
  paths: ["app/**", "components/**", "ui/**", "src/app/**", "src/components/**"]
checklist:
  - Loading and error state for async flows; semantic HTML/ARIA; labels and alt text
anti_patterns:
  - Blank or stuck UI during load; relying on color alone; missing focus order
examples: "Show spinner then success/error; empty state with CTA; form labels for every input."
---

# UI Patterns

Component and UX conventions for consistent, accessible interfaces.

## Component conventions

- Prefer small, composable components; single responsibility.
- Use a consistent naming scheme (e.g. PascalCase components, camelCase props).
- Keep presentational vs container separation where it helps clarity.

## State, loading, error

- Every async flow: show loading state, then success or error state. Avoid blank or stuck UI.
- Error UI: user-friendly message and optional retry or link to support.
- Empty states: explicit message or CTA instead of blank area.

## Accessibility (a11y) basics

- Use semantic HTML and ARIA where needed (buttons, links, landmarks).
- Ensure focus order and keyboard navigation work; avoid focus traps unless modal.
- Sufficient color contrast; do not rely on color alone for meaning.
- Provide alt text for images and labels for form fields.

## Search prompts

Use these (or similar) semantic search queries before changing UI:

- Where are the main page components or layouts defined for this feature?
- How is loading state or error state shown in components?
- Where are form components or client-side validation used?

## Output

When changing UI: list **components/pages changed**, **behavior change**, and a **screenshots checklist** (what to verify visually) plus **test steps**.
