# Slice-2 Contract Checklist (Frozen)

- [x] `UploadDispatchRequest` frozen.
- [x] `UploadDispatchDecision` frozen.
- [x] `UploadDispatchResponse` frozen.
- [x] `RoutingReason` enum frozen.
- [x] `ExplorerFolderItem` frozen.
- [x] `ExplorerFileItem` frozen.
- [x] `ExplorerListRequest` frozen.
- [x] `ExplorerListResponse` frozen.
- [x] `ExplorerSort` frozen.
- [x] `ExplorerFilter` frozen.
- [x] Cursor pagination contract frozen via `ExplorerCursor`, `ExplorerPageRequest`, and `ExplorerPageResponse`.
- [x] Standard API error envelope is reused unchanged through existing `ApiError` (`lib/contracts/storage-account.contracts.ts`).
- [x] Canonical naming lock applied for slice-2 contracts: `sizeBytes`, `mime`, and upload dispatch response envelope `dispatch`.
- [x] Duplicate competing shape export removed: `dispatchReasonSchema` (use `routingReasonSchema` as canonical enum source).
- [x] Explorer sort field now reuses `fileSortBySchema` to avoid duplicated sort-field enums.
- [x] Slice-2 route/service/component consumers now import from canonical `@/lib/contracts` instead of compatibility re-export shims.
- [x] Minimal auth boundary contracts are frozen for sign up/sign in/sign out/current session/current user responses.
- [x] Provider union assumptions are normalized to shared `AccountProvider` where slice-2 adapters and UI filters require provider typing.

## Explicit Out of Scope for Slice-2 Freeze

- [ ] Provider real upload execution contracts.
- [ ] Preview generation pipeline contracts.
- [ ] Share token resolution contracts.
- [ ] Sync center mutation contracts.
