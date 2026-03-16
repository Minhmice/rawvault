# Architecture Rules — RawVault Phase 0

Governance for route design, auth, closure discipline, and QA. Source: PLAN.md §5.2 (Thin routes), §5.4 (Strict auth), §5.5 (Incremental closure), §5.6 (QA support), §10 (Auth, Provider, Metadata, QA rules).

---

## 1. Thin route handlers

- API routes **parse**, **validate**, **delegate**, and **return**.
- **Business logic** lives in the service layer (`lib/*` services), not in route handlers.
- **Provider-specific logic** lives in adapter/provider modules (e.g. under `lib/file-access/adapters/`, `lib/uploads/adapters/`), not in routes or generic services.

### Checklist

- [ ] Each route: parse input (e.g. body, query, params), validate (contract or schema), call one or more services, return a single canonical response shape.
- [ ] No multi-step business workflows implemented inline in route files; delegate to `lib/*` services.
- [ ] No provider-specific branching or API calls in route handlers; use adapters/services that normalize to app contracts.
- [ ] Response shapes align with `lib/contracts/`; no ad-hoc JSON built only in the route.

---

## 2. Strict auth and ownership

- **401** for unauthenticated access to protected routes; no permissive bypass.
- **No permissive fallback** in protected routes (e.g. no “allow if no user” for user-scoped resources).
- **RLS and service-layer checks align**: what RLS enforces at DB level is consistent with what services assume about ownership and scope.
- Dev helpers (e.g. test-only or debug paths) must remain **explicitly gated** (e.g. env flag or explicit opt-in); never default to permissive in production.

### Checklist

- [ ] Protected routes call a single auth/require-user pattern and return 401 when unauthenticated.
- [ ] No route or service bypasses auth “for convenience” (e.g. optional user, fallback to public).
- [ ] User-owned resources are permission-scoped in both RLS and service layer; no mismatch.
- [ ] Any dev-only or test-only bypass is clearly gated and documented.

---

## 3. Incremental closure

- **Each slice is verifiable in isolation**: one slice can be tested and closed before the next critical slice starts.
- **No “almost done” drift** across multiple areas; avoid leaving several slices partially implemented.
- **Slice closed before the next**: complete scope, contracts, validation, and safety checks for the current slice before starting the next critical slice.

### Checklist

- [ ] Slice has clear scope and done criteria (from PLAN.md or slice doc).
- [ ] Before moving on: contracts stable, routes and services aligned, auth and ownership verified for that slice.
- [ ] No broad “touch everything” work that leaves multiple slices in an unfinished state; finish one slice then proceed.
- [ ] Slice closure checklist (scope, contract, validation, safety, merge) is used where applicable (see PLAN.md §13).

---

## 4. Deterministic QA support

- **Reproducible flows** where possible in dev/local (e.g. seeded data, fixed test accounts).
- **Provider flows** may require manual env/config; verification steps must still be **documented** (e.g. what to set up, how to run, expected outcomes).
- **No greenwashing**: verification must not rely only on UI impressions; route-level or contract-level checks are required for critical paths.

### Checklist

- [ ] Critical app flows have a documented verification path (steps, expected responses or states).
- [ ] Where seeding or test data is used, it is documented and reproducible where feasible.
- [ ] Provider-dependent flows (OAuth, upload, download) have documented validation steps and known limitations (e.g. manual token, env vars).
- [ ] QA sign-off is based on reproducible checks (e.g. route tests, contract compliance), not only “it looks good” in the UI.

---

## 5. Auth, Provider, Metadata, and QA rules (from §10)

### Auth rules

- Signed-out access to protected routes returns **401**.
- No permissive fallback in protected routes.
- Dev helpers must remain explicitly gated.

### Provider rules

- **Tokens remain server-only**; never expose provider tokens to the client.
- **Provider-specific responses** must be normalized before leaving the service layer (e.g. to contract shapes).
- **Provider logic** must be isolated from generic app contracts (adapters/implementations behind a single app-facing API).

### Metadata rules

- **App DB** stores metadata and business state; **provider** stores binaries.
- **File records** must not indicate upload success until provider success is confirmed; no optimistic “success” before provider confirmation.

### QA rules

- Each slice needs **route-level verification** (or equivalent contract-level checks).
- Each critical **provider flow** must have a **documented validation path**.
- No greenwashing based only on UI impressions; verification must be reproducible and criteria-based.

### Checklist

- [ ] Auth: 401 on protected routes when unauthenticated; no silent fallback to allowed.
- [ ] Provider: tokens only in server code; adapter output is normalized to contracts; no provider types leaking into app API.
- [ ] Metadata: upload success written only after provider success; app DB and provider roles are clearly separated.
- [ ] QA: slice verification path documented; provider flows have documented validation; sign-off uses explicit criteria.

---

## 6. Canonical folder layout (reference)

- **`app/api/`** — Route handlers only; thin layer that parses, validates, delegates to `lib/`, returns.
- **`lib/`** — Services, adapters, and shared logic:
  - `lib/auth/` — Auth helpers, require-user, session.
  - `lib/contracts/` — Canonical request/response and shared types (see `docs/CONTRACT_RULES.md`).
  - `lib/explorer/` — Unified explorer service.
  - `lib/file-access/` — Download/stream; adapters per provider.
  - `lib/share/` — Share service and token handling.
  - `lib/storage-accounts/` — Linked accounts, browse, list, OAuth, token lifecycle.
  - `lib/uploads/` — Dispatch and execute; adapters per provider.
  - Other `lib/*` modules as introduced (e.g. metadata, activity) follow the same principle: business logic in services, provider logic in adapters.

New routes belong under `app/api/`; new business or provider logic belongs under `lib/` in the appropriate module.

---

## Cross-references

- **Contracts**: Canonical shapes and naming — see `docs/CONTRACT_RULES.md`.
- **Plan**: Execution principles, phases, and slice closure — see `PLAN.md` §5, §7, §10, §13.
