# Contract Rules — RawVault Phase 0

Governance for API and data contracts. Source: PLAN.md §5.1 (Contract-first), §5.3 (Canonical source of truth), §8.1 (Contracts), §10 (Naming rules).

---

## 1. Contract-first

- Contracts are **defined before** FE/BE integration for a given slice.
- Canonical request and response shapes must be **preserved**; no ad-hoc payloads in routes or UI.
- Duplicate or drifting payload shapes must **not** be introduced (no “almost the same” DTOs).

### Checklist

- [ ] New API surface: contract types and shapes exist in `lib/contracts/` before route or client code.
- [ ] Request/response types used by routes and clients are imported from contracts (or re-exported), not redefined.
- [ ] No duplicate type definitions for the same endpoint or concept elsewhere in the repo.
- [ ] When changing a contract: update the single source and all consumers; no silent drift.

---

## 2. Canonical source of truth

- **Single source** for app-layer contracts: `lib/contracts/`.
- **One canonical DB meaning** per field: same field name and semantics in schema, services, and contracts where they are exposed.
- **One naming scheme**: consistent across contracts, services, and DB (see Naming below).
- **No shadow DTOs** unless intentionally versioned (e.g. `v2` namespace or module), with explicit rationale and migration path.

### Checklist

- [ ] All API request/response shapes and shared types live under `lib/contracts/` (or a documented versioned sub-set).
- [ ] Each exposed field has one agreed meaning; DB column semantics match contract field semantics.
- [ ] Naming in contracts matches the chosen canonical scheme (no ad-hoc aliases in one layer only).
- [ ] Any “shadow” or alternate DTO is explicitly versioned and documented; no hidden parallel shapes.

---

## 3. Naming

- **One canonical field per concept**: one name for one idea across contracts, services, and DB.
- **No synonym pairs**: do not keep two names for the same concept (e.g. `id` and `identifier` for the same thing).
- **No parallel vocabulary**: request/response and services must not use different terms for the same concept (e.g. “fileId” in one place and “file_id” with different semantics elsewhere without a documented reason).

### Checklist

- [ ] Each concept has a single chosen name; all layers use it consistently.
- [ ] No duplicate concepts with different names (e.g. no synonym pairs) in active use.
- [ ] Naming style (camelCase vs snake_case) is consistent in contracts and aligned with DB/API conventions; any exception is documented.

---

## 4. Contract modules index (lib/contracts/)

| Module | Purpose |
|--------|--------|
| `index` | Re-exports all contract modules for a single import surface. |
| `auth` | Auth/session request and response shapes. |
| `drive-browse` | Google Drive (and provider) browse/list request and response. |
| `drive-import` | Drive import flow request and response. |
| `metadata` | File/folder metadata CRUD and related shapes. |
| `explorer` | Unified explorer query and response shapes. |
| `file-access` | Download/stream and file access request/response. |
| `share` | Share links, tokens, and share-related payloads. |
| `storage-account` | Linked storage account list and management. |
| `upload-dispatch-slice2` | Upload dispatch decision and routing. |
| `upload-execute` | Upload execution request and result. |
| `workspace-preferences` | Workspace preferences (e.g. locale, theme). |

When adding or renaming modules, update this index and `lib/contracts/index.ts`.

---

## Cross-references

- **Architecture**: Thin routes and service-layer usage of contracts — see `docs/ARCHITECTURE_RULES.md`.
- **Plan**: Full execution principles and contract deliverables — see `PLAN.md` §5, §8.1, §10.
