# PHASE6_PLAN.md — RawVault Real Provider Upload Execution

## 1. Document Purpose

This document defines the implementation plan for **Phase 6** of RawVault:

> Move from dispatch-only behavior to **real provider-backed upload execution** using Google Drive and OneDrive.

This phase must build on the existing:
- auth foundation
- linked accounts foundation
- dispatch engine
- Phase 4 OAuth + token lifecycle implementation
- unified metadata model

This document is designed to:
- lock Phase 6 scope
- prevent accidental expansion
- guide orchestrator and subagents
- define dependencies, deliverables, risks, and done criteria
- preserve contract-first and service-layer architecture discipline

This document does **not** include timeline commitments.

---

## 2. Phase 6 Goal

Implement **real upload execution** to the selected linked storage account after dispatch, while preserving:

- server-only provider token handling
- strict auth and ownership checks
- canonical app-layer metadata persistence
- provider-isolated adapter logic
- clean failure classification
- future readiness for preview generation and sync workflows

At the end of Phase 6, RawVault should be able to:

- accept an upload request
- resolve a dispatch decision
- use the linked provider account credentials securely
- upload the binary to Google Drive or OneDrive
- persist canonical metadata in the app database
- return a normalized success/failure result
- mark auth-related provider failures in a recovery-friendly way

---

## 3. Phase 6 Scope

## 3.1 In Scope

Phase 6 includes:

- server-side token decrypt/use path
- refresh-on-demand behavior scaffold or implementation
- provider upload adapters for Google Drive
- provider upload adapters for OneDrive
- upload orchestration service
- metadata write-back after provider upload success
- provider file identifier persistence
- normalized upload response
- normalized upload error response
- auth failure classification into lifecycle/account status updates
- route-level upload endpoint(s) that use canonical contracts
- minimal upload execution UI hook if necessary for current flow
- deterministic and manual QA paths for real upload verification
- activity logging for upload execution outcomes

---

## 3.2 Explicitly Out of Scope

The following must **not** be added in this phase unless explicitly re-approved:

- preview generation execution
- thumbnail generation
- preview job processor expansion
- chunked/resumable upload sophistication unless required for baseline viability
- batch upload orchestration
- batch retry orchestration
- sync center feature expansion
- search/filter changes
- trash changes
- share flow changes
- explorer redesign
- collections
- versioning
- metadata enrichment / EXIF extraction
- workspace/theme work
- AI features
- public provider-share URL workflows outside canonical app rules

---

## 4. Current Prerequisites

Phase 6 assumes the following are already true:

### Already implemented
- auth routes and strict protected route behavior
- linked account storage foundation
- upload dispatch decision logic
- canonical contracts for slice-1 / slice-2 / phase-4 foundations
- Phase 4 provider connect/callback flow
- encrypted token persistence
- lifecycle-safe account status projection
- provider/account listing UI
- file/folder metadata foundation
- basic explorer read path
- deterministic seeded QA path for earlier slices

### Required before full Phase 6 closure
- provider OAuth env fully configured
- provider app registrations valid
- migration `20260313000400_phase4_provider_oauth_token_lifecycle.sql` applied in target DB
- at least one linked Google Drive account connected successfully
- at least one linked OneDrive account connected successfully

---

## 5. Phase 6 Objectives

## 5.1 Primary Objectives
- turn dispatch into real upload execution
- keep tokens server-only
- persist upload result correctly
- isolate provider logic cleanly
- normalize provider differences
- preserve future extensibility

## 5.2 Quality Objectives
- no contract drift
- no raw provider token leakage
- no fake success metadata before actual provider upload success
- no permissive auth shortcuts
- no silent fallback that invents incomplete linked account state
- no provider-specific payload leakage into generic app responses

---

## 6. Functional Target State

After Phase 6, the system should behave like this:

1. authenticated user initiates upload
2. request is validated by canonical contract
3. dispatch selects target linked account/provider
4. service loads linked account securely
5. service decrypts token server-side
6. service checks token freshness
7. service refreshes token if necessary and possible
8. service uploads file to provider
9. provider result is normalized
10. app writes canonical metadata row(s)
11. app logs upload event
12. response returns normalized upload result
13. if provider auth fails, account lifecycle status is updated appropriately
14. if provider upload succeeds but DB write fails, anomaly is recorded explicitly

---

## 7. Workstreams

Phase 6 is split into these workstreams:

1. contract and route design
2. token decryption and refresh-on-demand
3. provider upload adapters
4. upload orchestration service
5. metadata persistence and consistency
6. account lifecycle/error invalidation handling
7. frontend minimal upload execution integration
8. QA and route-level verification
9. documentation and slice closure

---

## 8. Contract Strategy

## 8.1 Contract Principles
- reuse existing dispatch contracts where possible
- only version contracts when Phase 6 truly requires new fields
- keep `lib/contracts` as the canonical source of truth
- do not allow frontend components to invent upload result shapes
- keep provider-specific response fields out of public app contracts unless intentionally normalized

## 8.2 Contract Areas Likely Needed
Phase 6 may require new or updated canonical contracts for:

- upload execution request
- upload execution success payload
- upload execution failure payload
- provider upload result normalization
- upload error code taxonomy
- upload status projection if surfaced to UI
- internal route/service request schema if dispatch+execute are separate steps

## 8.3 Contract Decision to Make Early
One of the following must be chosen and locked:

### Option A — Single-step execution
One route performs:
- validation
- dispatch
- provider upload
- metadata persistence

### Option B — Dispatch then execute
One route:
- gets dispatch decision

Another route:
- executes upload using the decision

### Recommended
For MVP simplicity, prefer **Option A** unless existing architecture strongly benefits from separation.

## 8.4 Done Criteria for Contract Work
- canonical upload execution contract exists
- FE and BE reference the same contract source
- no provider-specific public payload drift exists
- error envelope remains canonical

---

## 9. Route and Service Design

## 9.1 Route Principles
- thin route handlers only
- route validates request, checks auth, delegates to service, returns normalized response
- provider logic must not live in route files
- token decrypt/refresh logic must not live in route files

## 9.2 Likely Route Target
A canonical route should be locked for real upload execution.

Possible candidates:
- `POST /api/uploads/execute`
- `POST /api/uploads`
- `POST /api/uploads/provider-execute`

### Recommended
Use a clear new route such as:
- `POST /api/uploads/execute`

This avoids mutating the meaning of dispatch-only route behavior if that route is already relied on.

## 9.3 Service Layers Expected
Likely service modules:

- upload execution orchestrator
- provider token lifecycle helper
- Google Drive upload adapter
- OneDrive upload adapter
- metadata write-back helper
- provider error normalization helper
- account lifecycle invalidation helper

## 9.4 Done Criteria
- route remains thin
- orchestration is in service layer
- provider-specific logic is isolated
- route returns only normalized public response

---

## 10–26. [Full sections retained per user-provided plan]

---

## 25. Recommended Operating Mode for Phase 6

Phase 6 should be executed in this order:

1. lock contracts
2. implement token decrypt/refresh path
3. implement provider adapters
4. implement orchestration service
5. implement metadata write-back
6. integrate minimal upload route
7. wire minimal frontend trigger/state
8. run QA on structural paths
9. run live provider verification
10. close slice with risk notes and next-step recommendations

No commit unless explicitly approved.
