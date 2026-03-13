# PLAN.md — RawVault MVP Execution Plan

## 1. Document Purpose

This document defines the execution plan for building the **RawVault MVP** in a structured, contract-first, implementation-safe way.

It is intended to:
- guide orchestrator-level execution
- define work breakdown clearly
- prevent accidental scope expansion
- keep product, backend, frontend, database, and QA aligned
- ensure all work is sequenced around dependencies, not around convenience

This document does **not** define timeline commitments.
It defines:
- implementation order
- scope boundaries
- deliverables
- dependencies
- risks
- quality gates
- done criteria

---

## 2. Product Intent

RawVault is a drive-lite application for RAW photographers that:
- uses Supabase for auth, metadata, policy, and business state
- uses Google Drive and OneDrive as binary storage backends
- presents users with one unified file library
- supports multiple linked storage accounts per user
- routes uploads intelligently
- supports future preview generation, secure sharing, sync recovery, and workspace customization

The MVP must prove that:
- the storage abstraction works
- provider-backed uploads work
- metadata stays consistent
- users can manage and access files through one unified interface

---

## 3. MVP Strategy

## 3.1 MVP interpretation used in this plan

This plan uses a **disciplined MVP interpretation**, not the full long-term PRD scope.

The MVP in this plan includes only the capabilities needed to make RawVault:
- functional
- testable
- coherent
- extendable

The MVP is divided into:
- **MVP Core**
- **MVP Usability Layer**
- **MVP Stability Layer**

---

## 3.2 MVP Core

These are the minimum capabilities required for RawVault to function as a real product foundation:

- user authentication
- user-bound metadata model
- linked storage accounts
- provider OAuth connection flow
- token persistence
- upload dispatch decision
- real provider upload execution
- metadata write-back after upload
- unified explorer
- file download / stream
- strict access control
- activity logging for core actions

---

## 3.3 MVP Usability Layer

These are the capabilities that make the product meaningfully usable:

- folder and file metadata CRUD
- trash / restore
- basic search / filter / sort
- preview status visibility
- basic share links
- account quota / health display
- error / loading / empty states
- deterministic QA flows

---

## 3.4 MVP Stability Layer

These are the capabilities that make the MVP safe to continue building on:

- token refresh strategy scaffold
- provider health state
- routing reason visibility
- retry-ready architecture
- audit-safe action logs
- environment validation
- protected route strictness
- service-layer architecture consistency
- contract freeze discipline

---

## 4. Explicit Out-of-Scope for This Plan

The following items must **not** be treated as required for MVP completion:

- AI-assisted workspace personalization
- AI-assisted component generation
- advanced metadata enrichment
- EXIF-heavy intelligence workflows
- collections
- smart collections
- file versioning
- advanced sync center
- advanced provider conflict resolution
- public theme marketplace
- large theme pack system
- advanced workspace layout generation
- complex realtime collaboration
- OCR / advanced AI extraction
- advanced batch orchestration
- marketplace-like theme/component ecosystem

These may be addressed later, but they must not block MVP completion.

---

## 5. Execution Principles

All implementation must follow these principles.

### 5.1 Contract-first
- contracts are defined before FE/BE integration
- canonical request/response shapes must be preserved
- duplicate or drifting payload shapes must not be introduced

### 5.2 Thin route handlers
- API routes parse, validate, delegate, and return
- business logic belongs in service layer
- provider-specific logic belongs in adapter/provider modules

### 5.3 Canonical source of truth
- one canonical contract source
- one canonical DB meaning per field
- one canonical naming scheme
- no shadow DTOs unless intentionally versioned

### 5.4 Strict auth and ownership
- all user-owned resources must be permission-scoped
- RLS and service-layer ownership checks must align
- no permissive auth bypass in protected routes

### 5.5 Incremental closure
- each slice must be verifiable in isolation
- no “almost done” drift across multiple areas
- a slice should close before the next critical slice begins

### 5.6 Deterministic QA support
- dev and local environments should support reproducible seeded flows where possible
- provider flows may require manual env/config, but verification steps must still be documented

---

## 6. Workstream Structure

The plan is organized into the following workstreams:

1. Product scope and contract governance
2. Authentication and user foundation
3. Database schema and RLS foundation
4. Linked storage accounts
5. Provider OAuth and token lifecycle
6. Upload dispatch engine
7. Real provider upload execution
8. File/folder metadata management
9. Unified explorer
10. Download / stream layer
11. Preview status foundation
12. Share system foundation
13. Search / filter / sort
14. Trash / restore
15. Activity logging and audit baseline
16. Stability / hardening / QA closure

---

## 7. Phase Plan

# Phase 0 — Scope Lock and Governance

## Goal
Establish the rules that prevent the project from drifting before implementation continues.

## Objectives
- define the exact MVP boundary
- freeze naming decisions
- freeze architectural rules
- identify what is already implemented and trusted
- identify what still requires implementation or verification

## Deliverables
- `MVP_SCOPE.md`
- `OUT_OF_SCOPE.md`
- `CONTRACT_RULES.md`
- `ARCHITECTURE_RULES.md`
- `SLICE_STATUS.md`

## Required decisions
- exact MVP feature list
- required provider support level in MVP
- whether preview execution is full MVP or only status foundation
- whether share supports file only or file + folder in MVP
- whether batch operations are fully deferred

## Done criteria
- there is one unambiguous MVP scope document
- future agents can distinguish “must build now” vs “later roadmap”
- naming lock decisions are explicit
- all stakeholders can identify what counts as MVP complete

## Risks
- scope inflation
- accidental adoption of the full PRD as “must-do now”
- feature bleed from future phases into current implementation

---

# Phase 1 — Authentication and User Foundation

## Goal
Ensure user identity, session handling, and basic auth behavior are stable and safe.

## Objectives
- support sign up, sign in, sign out
- expose current session/user
- ensure signed-out handling is explicit and predictable
- enforce strict protected route behavior

## Functional scope
- sign up
- sign in
- sign out
- get current session
- get current user
- signed-out state handling
- 401 behavior for protected endpoints

## Deliverables
- auth contracts
- auth routes
- auth service layer
- auth UI/testing panel
- auth error normalization utilities

## Dependencies
- Supabase project configuration
- base environment variables
- route + service architecture conventions

## Done criteria
- auth endpoints return stable canonical responses
- protected routes reject unauthenticated requests consistently
- auth UI can demonstrate complete basic session flow
- error handling is normalized and non-fragile

## Risks
- Supabase auth edge cases
- inconsistent session behavior between SSR/API/client
- route-level auth bypasses introduced for convenience

---

# Phase 2 — Database Foundation and RLS

## Goal
Define the persistent model for all MVP-critical state and enforce ownership rules.

## Objectives
- create the core schema
- define indexes and constraints
- define ownership policies
- support metadata-only architecture for file records

## Functional scope
- core tables
- essential indexes
- ownership rules
- soft-delete-ready structures
- quota fields
- token fields
- preview/share/activity foundations

## MVP-required tables
- `linked_accounts`
- `folders`
- `files`
- `share_links`
- `preview_jobs`
- `activity_logs`
- `workspace_preferences` (only if minimal theme/layout support is included)
- optional lightweight support tables only if required by chosen MVP scope

## Deliverables
- migrations
- DB summary docs
- RLS policies
- constraint/index summary
- ownership model documentation

## Required integrity rules
- user-scoped ownership for user resources
- unique provider account identity per user
- active account invariants as required
- soft-delete-safe uniqueness where needed
- non-negative quota and size validation
- path/tree rules documented even if path is derived

## Dependencies
- MVP contract decisions
- naming lock
- provider account metadata requirements

## Done criteria
- core tables exist and are queryable
- RLS behavior matches ownership expectations
- migrations are repeatable
- schema supports current and near-next slices without immediate redesign

## Risks
- schema overdesign
- premature expansion into non-MVP entities
- mismatch between service assumptions and DB constraints

---

# Phase 3 — Linked Storage Accounts

## Goal
Support multiple linked storage accounts under one user with safe visibility and lifecycle controls.

## Objectives
- show linked account list
- link/unlink accounts
- set active account
- expose quota and health fields
- prepare token lifecycle support

## Functional scope
- list linked accounts
- add linked account metadata record
- unlink account
- set active account
- show provider/account identity
- show quota info
- show status/health info

## Deliverables
- storage account contracts
- account management service layer
- account routes
- account UI section
- provider badge handling
- account row/list states

## Dependencies
- auth
- database foundation
- provider account identity model
- eventual OAuth callback data shape

## Done criteria
- users can see multiple accounts
- users can change active account safely
- unlink behavior is explicit and safe
- UI and API use the same canonical account model

## Risks
- linked account lifecycle may later conflict with real OAuth state
- account health fields may be underspecified
- unlink rules may need later refinement if files already depend on that account

---

# Phase 4 — Provider OAuth and Token Lifecycle

## Goal
Establish real provider connection flows for Google Drive and OneDrive.

## Objectives
- support provider connect flow
- support provider callback flow
- persist tokens securely
- track expiry
- scaffold refresh behavior
- support account relinking/recovery patterns later

## Functional scope
- Google Drive connect initiation
- Google Drive callback handling
- OneDrive connect initiation
- OneDrive callback handling
- provider account metadata extraction
- encrypted token persistence
- expiry metadata persistence
- refresh strategy scaffolding
- invalid token state exposure

## Deliverables
- provider auth service layer
- callback routes
- token encryption/persistence path
- provider account mapping utilities
- env validation rules for provider secrets
- failure-state UX for connect flow

## Dependencies
- linked account data model
- secure environment configuration
- encryption strategy
- provider app registrations

## Done criteria
- user can complete provider connection flow
- account metadata is persisted correctly
- access/refresh token handling remains server-only
- invalid or expired states can be surfaced to the app
- both providers have working connection scaffolding

## Risks
- OAuth provider setup complexity
- inconsistent provider metadata fields
- token refresh edge cases
- accidental token exposure to client logs or responses

## Notes
This phase is one of the highest-risk and highest-dependency areas in the project.

---

# Phase 5 — Upload Dispatch Engine

## Goal
Decide where uploads should go before performing provider upload.

## Objectives
- evaluate available linked accounts
- choose account/provider based on policy
- expose routing reason
- preserve deterministic decision logic

## Functional scope
- upload dispatch request validation
- account selection by quota
- preferred provider override
- preferred account override
- account fallback
- file attribute-aware routing hooks
- routing decision trace
- canonical dispatch response

## Deliverables
- upload dispatch contracts
- dispatch service
- dispatch route
- routing reason enum/model
- activity log entry for dispatch decision

## Dependencies
- linked account list
- quota model
- canonical upload request model
- auth and ownership

## Done criteria
- dispatch returns a stable canonical response
- routing reason is explicit
- dispatch works on real linked account data
- decisions can be inspected and tested deterministically

## Risks
- policy logic becomes too ambitious too early
- real provider health may later need to influence selection
- dispatch may drift from actual upload behavior if not integrated carefully

---

# Phase 6 — Real Provider Upload Execution

## Goal
Turn dispatch decisions into actual binary uploads to Google Drive and OneDrive.

## Objectives
- perform real provider upload
- write metadata after success
- handle provider file IDs
- support failure handling without corrupting app state

## Functional scope
- upload file to Google Drive
- upload file to OneDrive
- map provider response fields
- assign original provider file id
- prepare thumbnail/preview id fields if not yet used
- detect upload failure
- return normalized upload result
- prepare retry-safe architecture

## Deliverables
- provider upload adapters
- upload orchestration service
- provider response normalization
- metadata persistence flow after success
- upload error normalization
- retry classification scaffolding

## Dependencies
- provider OAuth/token lifecycle
- dispatch engine
- file metadata model
- storage adapter design
- secure server-side file handling strategy

## Done criteria
- one real upload succeeds to Google Drive
- one real upload succeeds to OneDrive
- successful uploads write correct metadata
- provider file identifiers are persisted correctly
- failed uploads do not leave inconsistent success state in app metadata

## Risks
- provider API differences
- upload size limits / chunking behavior
- partial failure between provider success and DB write
- need for idempotency/retry design

## Notes
This is one of the most critical phases for proving RawVault is real.

---

# Phase 7 — File and Folder Metadata Management

## Goal
Support app-layer organization and metadata operations for stored content.

## Objectives
- support folder CRUD
- support file metadata updates
- support soft delete / restore-ready state
- support move and rename semantics
- support folder-based explorer navigation

## Functional scope
- create folder
- rename folder
- soft delete folder
- restore folder
- create file metadata record as part of upload
- update file metadata
- soft delete file
- restore file
- move file
- move folder
- rename file
- get file details
- list by folder
- breadcrumb/path behavior

## Deliverables
- folder contracts
- file contracts
- folder/file routes
- service-layer metadata operations
- path/breadcrumb utilities
- validation rules for move/rename/delete/restore

## Dependencies
- auth
- DB schema
- upload result persistence
- explorer model requirements

## Done criteria
- folder navigation model is coherent
- file records can be read and updated safely
- soft deletion is represented consistently
- move/rename flows preserve metadata correctness

## Risks
- folder tree path consistency
- cascade behavior ambiguity
- restoring deleted parents/children safely
- uniqueness rules during move/restore

---

# Phase 8 — Unified Explorer

## Goal
Present the user with one coherent library regardless of underlying provider.

## Objectives
- show folder tree
- show file list
- show file details
- show provider badge
- show preview status
- show sync/account context where relevant

## Functional scope
- folder navigation
- file listing
- file detail panel / fetch
- provider badge display
- basic sort/filter hooks
- loading/error/empty states
- explorer contracts
- cursor or pagination model if needed

## Deliverables
- explorer contracts
- explorer service
- explorer routes
- unified explorer UI
- file list
- folder tree
- explorer controls
- file detail fetch flow

## Dependencies
- file/folder metadata management
- upload metadata persistence
- provider/account display data
- preview status model

## Done criteria
- users can browse folders and files
- list data is canonical and stable
- UI states are not misleading
- explorer reflects one unified library rather than provider-siloed views

## Risks
- explorer query performance
- drift between UI state model and backend shape
- underdefined pagination/sorting behavior

---

# Phase 9 — Download and Stream Layer

## Goal
Allow users to retrieve file content from the correct provider through the app layer.

## Objectives
- locate correct provider/account for a file
- download or stream through normalized app endpoints
- enforce permissions before any file access

## Functional scope
- file download endpoint
- file stream endpoint
- provider-aware resolution
- app-layer permission checks
- redirect/proxy decision model
- error normalization for missing provider file or invalid token

## Deliverables
- provider download/stream adapters
- file access service
- download route
- stream route
- permission enforcement
- basic access log entry

## Dependencies
- file metadata
- provider file IDs
- valid tokens
- auth and permission layer

## Done criteria
- user can download a file via app route
- user can stream supported content via app route
- file access always uses the correct provider/account
- unauthorized access is blocked consistently

## Risks
- token expiration during access
- provider throttling
- large file streaming behavior
- deciding redirect vs proxy behavior

---

# Phase 10 — Preview Status Foundation

## Goal
Introduce preview status as a real part of the system state, without necessarily requiring a full advanced preview pipeline.

## Objectives
- track preview lifecycle states
- show preview readiness in UI
- support retry-ready structure
- avoid blocking MVP on full media processing sophistication

## Functional scope
- preview job creation
- preview status fields
- pending / processing / ready / failed
- last error code
- retry preview job endpoint or scaffold
- explorer display of preview status

## Deliverables
- preview job model
- preview contracts
- preview status service
- preview retry route or reserved placeholder route
- explorer UI status wiring

## Dependencies
- files table
- upload completion state
- job/background architecture decision
- provider thumb/preview field design

## Done criteria
- preview status exists and is visible
- state transitions are representable
- failed state can be shown clearly
- architecture supports fuller preview execution later

## Risks
- overcommitting to a heavy preview processor too early
- unclear storage location for preview assets
- mismatch between preview job and file state

## MVP guidance
For MVP, status foundation is required.
Full sophisticated preview generation is optional unless explicitly locked into scope.

---

# Phase 11 — Share System Foundation

## Goal
Support secure app-layer share links for at least the simplest useful case.

## Objectives
- create share links
- validate share tokens
- support TTL
- support revoke
- control download permission
- track access

## Functional scope
- create share link
- list share links
- revoke share link
- token validation
- access through public share route
- allow/disallow download flag
- access logging

## Deliverables
- share link contracts
- share link service
- share link routes
- public token validation route
- basic share UI
- access log integration

## Dependencies
- file metadata
- permission rules
- download/stream layer
- token generation strategy

## Done criteria
- share link can be created
- revoked links stop working
- expired links stop working
- access behavior is validated through app layer
- at least file sharing works coherently

## Risks
- file vs folder share complexity
- public route abuse
- unclear semantics for nested folder sharing
- direct provider URL leakage

## MVP guidance
File share should be prioritized before folder share if scope pressure exists.

---

# Phase 12 — Search / Filter / Sort

## Goal
Make the unified library navigable at practical scale.

## Objectives
- support basic search
- support provider and status filters
- support common sort options

## Functional scope
- search by file name
- filter by extension / mime / provider / preview status
- sort by name / created / modified / size
- folder-based narrowing
- basic saved preset support only if cheap and stable

## Deliverables
- search contracts
- search routes or explorer query extensions
- backend query logic
- UI controls for search/filter/sort
- empty state behavior for no-result cases

## Dependencies
- explorer data model
- file/folder metadata
- preview/provider fields

## Done criteria
- users can locate files by name and key properties
- search/filter/sort behavior is consistent and predictable
- results align with explorer ownership and deletion rules

## Risks
- search complexity explosion
- poor indexing
- mixing live explorer navigation with global search semantics

---

# Phase 13 — Trash / Restore

## Goal
Provide safe deletion behavior for normal user workflows.

## Objectives
- move items to trash
- list trash contents
- restore items
- prepare purge behavior safely

## Functional scope
- trash file
- trash folder
- list trash
- restore file
- restore folder
- optional purge route if explicitly required in MVP
- original location awareness where feasible

## Deliverables
- trash contracts
- trash service
- trash routes
- trash UI list/state
- restore rules
- conflict handling notes for restore

## Dependencies
- file/folder soft delete model
- explorer exclusions for deleted items
- move/restore constraints

## Done criteria
- deleted items disappear from normal explorer
- deleted items appear in trash view
- restore works for simple valid cases
- restore conflicts are handled explicitly

## Risks
- nested deletion semantics
- restoring into deleted parent paths
- name/path collisions on restore

---

# Phase 14 — Activity Logging and Audit Baseline

## Goal
Provide accountability for important user and system actions.

## Objectives
- record major actions
- maintain lightweight audit visibility
- support debugging and future admin tooling

## Functional scope
- log upload
- log delete
- log restore
- log rename
- log move
- log share create/revoke
- log provider link/unlink
- log dispatch decision
- log access attempts where appropriate

## Deliverables
- activity log schema usage
- logging utilities
- payload conventions
- timeline query or limited activity view if in MVP
- audit documentation

## Dependencies
- core routes and services
- canonical action taxonomy
- payload redaction rules

## Done criteria
- important actions are logged consistently
- logs avoid leaking secrets
- logs are structured enough for future analysis

## Risks
- logging too much noise
- logging sensitive token/provider data
- inconsistent action naming

---

# Phase 15 — Stability, Security, and Hardening

## Goal
Prevent the MVP from collapsing under normal edge cases and prepare the codebase for future slices.

## Objectives
- validate env assumptions
- secure token handling
- add endpoint protection patterns
- classify failure modes
- ensure deterministic QA for critical flows

## Functional scope
- token encryption verification
- server-only token access
- route-level permission consistency review
- rate limiting scaffolding for sensitive routes
- provider error classification
- invalid token state handling
- stale metadata classification scaffolding
- account almost-full state handling
- upload failure classification
- health status basics
- seed tooling / QA verifier maintenance

## Deliverables
- env validation rules
- hardening checklist
- QA scripts and docs
- provider risk notes
- error taxonomy notes
- go/no-go checklist for MVP handoff

## Dependencies
- most core features already implemented
- provider flows already integrated
- deterministic local/dev behavior documented

## Done criteria
- no core flow depends on unsafe shortcuts
- tokens are not exposed to clients
- protected routes remain strict
- critical flows can be reverified deterministically
- known risks are documented clearly

## Risks
- hidden assumptions in environment
- silent token expiry failures
- provider drift not surfaced to user
- insufficient smoke coverage

---

## 8. Cross-Functional Deliverables

These cut across phases and must be maintained continuously.

### 8.1 Contracts
- canonical contracts index
- per-slice contract checklist
- explicit contract diffs when versioning is necessary

### 8.2 Documentation
- DB summary docs
- environment requirement docs
- QA verification docs
- slice closure docs
- risk notes

### 8.3 Testing and QA
- deterministic seed data where feasible
- route-level smoke verification
- signed-in and signed-out verification paths
- provider integration verification checklists

### 8.4 UI quality
- loading states
- empty states
- error messaging
- destructive action clarity
- account/provider visibility where needed

---

## 9. Dependency Order

The implementation must generally follow this dependency structure:

1. scope/governance
2. auth
3. DB schema/RLS
4. linked accounts
5. provider OAuth/token lifecycle
6. dispatch engine
7. real upload execution
8. file/folder metadata management
9. unified explorer
10. download/stream
11. preview status foundation
12. share foundation
13. search/filter/sort
14. trash/restore
15. activity log baseline
16. stability/hardening/QA closure

### Important dependency notes
- real uploads must not be treated as complete before provider OAuth/token handling exists
- explorer should not be treated as final before metadata shape is stable
- share should not bypass app-layer permission logic
- preview should not force a heavy background system before status/state needs are defined
- security hardening is not “after everything”; it must be checked continuously

---

## 10. Canonical Rules That Must Not Drift

### Naming rules
- use one canonical field per concept
- do not keep synonym pairs alive
- avoid parallel request/response vocabulary for the same concept

### Auth rules
- signed-out protected access returns `401`
- no permissive fallback in protected routes
- dev helpers must remain explicitly gated

### Provider rules
- tokens remain server-only
- provider-specific responses must be normalized before leaving service layer
- provider logic must be isolated from generic app contracts

### Metadata rules
- app DB stores metadata and business state
- provider stores binaries
- file records must not pretend upload succeeded before provider success is confirmed

### QA rules
- each slice needs route-level verification
- each critical provider flow must have a documented validation path
- no greenwashing based only on UI impressions

---

## 11. Done Criteria for MVP

The MVP is considered complete when all of the following are true:

### Identity and ownership
- user can sign in and sign out
- user/session endpoints are stable
- user-owned resources are permission-scoped
- protected routes reject unauthorized access consistently

### Linked storage
- user can connect Google Drive
- user can connect OneDrive
- linked account metadata is persisted correctly
- account list is visible and coherent
- active account logic is stable

### Upload and storage
- upload dispatch returns valid routing decision
- at least one real upload succeeds to Google Drive
- at least one real upload succeeds to OneDrive
- upload result writes file metadata correctly
- provider file IDs are stored correctly

### File management
- user can browse folders and files in a unified explorer
- folder and file metadata operations work for MVP-supported actions
- provider badges and preview status are visible
- deleted items can be managed through trash if included in final MVP lock

### File access
- file download works through the correct provider path
- file stream works where supported
- unauthorized access is blocked

### Share and preview
- basic share link creation and revoke works
- preview status is represented and shown
- preview/job error state can be surfaced without ambiguity

### Search and usability
- basic search/filter/sort works
- loading/empty/error states exist for major views
- account quota/health state is visible enough for routing-related UX

### Stability and safety
- important actions are logged
- tokens are not exposed to clients
- env validation exists
- deterministic QA or verification paths are documented
- lint/build/basic verification pass

---

## 12. Suggested Agent Breakdown

If using orchestrated subagents, the work can be split like this:

### orchestrator
- controls slice sequencing
- preserves scope boundaries
- merges outputs
- resolves conflicts
- checks done criteria

### backend-developer
- routes
- services
- provider adapters
- auth integration
- DB interaction
- share/download/upload execution

### frontend-developer
- account management UI
- explorer UI
- auth UI
- upload UI
- share UI
- search/filter/trash states

### database-specialist
- migrations
- RLS
- indexes
- constraints
- schema evolution discipline

### typescript-specialist
- contract freeze
- type safety
- DTO normalization
- canonical source-of-truth maintenance

### qa-tester
- route checks
- signed-in/signed-out verification
- provider integration verification
- regression reports

### code-reviewer
- architectural consistency
- auth strictness
- provider abstraction discipline
- naming drift prevention

---

## 13. Slice Closure Checklist Template

Each slice should be closed using the following checklist:

### Scope closure
- was the slice goal completed?
- was any non-scope work added?
- were any scope items skipped?

### Contract closure
- are contracts stable?
- was versioning necessary?
- are FE and BE aligned to the same shapes?

### Validation closure
- are relevant routes tested?
- are auth states validated?
- are failure states observed and documented?

### Safety closure
- any new secret handling risk?
- any new auth bypass risk?
- any new data consistency risk?

### Merge closure
- changed files listed
- docs updated
- risk notes updated
- next-slice dependencies updated

---

## 14. Known High-Risk Areas

The following areas need extra caution throughout implementation:

### Provider OAuth setup
- provider app registration mismatch
- redirect URI mismatch
- missing scopes
- callback parsing inconsistency

### Token lifecycle
- incorrect refresh timing
- expired token behavior
- lost refresh token
- insecure storage or leakage

### Upload correctness
- provider upload success but DB write fails
- DB write succeeds but provider upload metadata is incomplete
- chunking and retry complexity

### Folder/file consistency
- move/restore collisions
- path invalidation
- deleted-parent edge cases

### Share security
- token leakage
- revoke not enforced everywhere
- download bypass through provider URL exposure

### Preview pipeline overreach
- trying to build a fully advanced media system too early
- undefined preview asset storage rules
- UI promises exceeding backend reality

---

## 15. Recommended Operating Mode

The recommended execution mode for RawVault is:

- contract-first
- slice-by-slice
- provider-risk-aware
- deterministic QA-backed
- architecture-preserving
- no commit unless explicitly approved
- no silent scope expansion
- no preview/AI/theme expansion before storage core is proven stable

---

## 16. Final Guidance

The project should be treated as complete in layers:

### First prove:
- auth
- linked accounts
- dispatch
- real upload
- metadata persistence

### Then prove:
- unified explorer
- download/stream
- basic share
- preview status
- search/trash usability

### Then harden:
- activity logs
- token handling
- health/error states
- QA closure
- extension-readiness

The success of RawVault MVP depends less on surface feature count and more on whether these foundations are truly reliable:
- provider connection
- upload correctness
- metadata integrity
- unified library coherence
- secure access control

If those are strong, future phases become manageable.
If those are weak, adding more features only compounds instability.