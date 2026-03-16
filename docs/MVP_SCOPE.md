# RawVault MVP Scope (Phase 0)

This document defines the **unambiguous MVP boundary** for RawVault. It is the single source of truth for what is "in MVP" and must be built or verified for MVP completion. Nothing outside this scope is required for MVP.

The MVP uses a **disciplined interpretation**: only capabilities needed to make RawVault functional, testable, coherent, and extendable. The MVP is divided into **MVP Core**, **MVP Usability Layer**, and **MVP Stability Layer**.

---

## MVP Core

Minimum capabilities required for RawVault to function as a real product foundation:

| # | Capability |
|---|-------------|
| 1 | User authentication |
| 2 | User-bound metadata model |
| 3 | Linked storage accounts |
| 4 | Provider OAuth connection flow |
| 5 | Token persistence |
| 6 | Upload dispatch decision |
| 7 | Real provider upload execution |
| 8 | Metadata write-back after upload |
| 9 | Unified explorer |
| 10 | File download / stream |
| 11 | Strict access control |
| 12 | Activity logging for core actions |

---

## MVP Usability Layer

Capabilities that make the product meaningfully usable:

| # | Capability |
|---|-------------|
| 1 | Folder and file metadata CRUD |
| 2 | Trash / restore |
| 3 | Basic search / filter / sort |
| 4 | Preview status visibility |
| 5 | Basic share links |
| 6 | Account quota / health display |
| 7 | Error / loading / empty states |
| 8 | Deterministic QA flows |

---

## MVP Stability Layer

Capabilities that make the MVP safe to continue building on:

| # | Capability |
|---|-------------|
| 1 | Token refresh strategy scaffold |
| 2 | Provider health state |
| 3 | Routing reason visibility |
| 4 | Retry-ready architecture |
| 5 | Audit-safe action logs |
| 6 | Environment validation |
| 7 | Protected route strictness |
| 8 | Service-layer architecture consistency |
| 9 | Contract freeze discipline |

---

## Phase Mapping (1–15)

| Phase | Focus | MVP layer(s) |
|-------|--------|---------------|
| 1 | Authentication and user foundation | Core (auth) |
| 2 | Database foundation and RLS | Core (metadata model, access) |
| 3 | Linked storage accounts | Core (linked accounts) |
| 4 | Provider OAuth and token lifecycle | Core (OAuth, token persistence), Stability (refresh scaffold) |
| 5 | Upload dispatch engine | Core (upload dispatch), Stability (routing reason) |
| 6 | Real provider upload execution | Core (real upload, metadata write-back), Stability (retry-ready) |
| 7 | File and folder metadata management | Usability (folder/file CRUD) |
| 8 | Unified explorer | Core (unified explorer), Usability (states) |
| 9 | Download and stream layer | Core (file download/stream, access control) |
| 10 | Preview status foundation | Usability (preview status visibility) |
| 11 | Share system foundation | Usability (basic share links) |
| 12 | Search / filter / sort | Usability (basic search/filter/sort) |
| 13 | Trash / restore | Usability (trash/restore) |
| 14 | Activity logging and audit baseline | Core (activity logging), Stability (audit-safe logs) |
| 15 | Stability, security, and hardening | Stability (env validation, protected routes, health, QA) |

---

## Required Decisions (Phase 0)

The following decisions are required to lock MVP scope. Use "TBD" until decided.

| Decision | Status |
|----------|--------|
| Exact MVP feature list | TBD — this document enumerates capabilities; final feature list may trim or confirm each item. |
| Required provider support level in MVP | TBD — e.g. Google Drive only, or both Google Drive and OneDrive. |
| Preview: full execution vs status-only in MVP | TBD — status foundation is in scope; full preview generation is optional unless explicitly locked in. |
| Share: file only vs file + folder in MVP | TBD — file share prioritized if scope pressure exists; folder share may be deferred. |
| Batch operations: fully deferred? | TBD — advanced batch orchestration is out of scope; confirm whether any batch operations are in MVP. |

---

## Summary

- **MVP Core**: 12 capabilities (auth, metadata, linked accounts, OAuth, tokens, dispatch, real upload, write-back, explorer, download/stream, access control, activity logging).
- **MVP Usability**: 8 capabilities (folder/file CRUD, trash/restore, search/filter/sort, preview status, share links, quota/health display, UI states, QA flows).
- **MVP Stability**: 9 capabilities (token refresh scaffold, provider health, routing reason, retry-ready, audit logs, env validation, protected routes, service-layer consistency, contract freeze).

Items not listed in this document are not required for MVP completion. See `docs/OUT_OF_SCOPE.md` for what must not block MVP.
