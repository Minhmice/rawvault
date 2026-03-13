# Foundation Contract Checklist (Frozen)

- [x] `AccountProvider` enum (`gdrive | onedrive`) frozen for slice-1 API payloads.
- [x] `AccountStatus` enum (`active | inactive | reauth_required | error`) frozen.
- [x] `AccountQuotaStatus` enum (`healthy | near_limit | full | unknown`) frozen.
- [x] `TokenLifecycleStatus` enum (`missing | valid | expiring_soon | expired`) frozen for safe app-layer exposure.
- [x] `LinkedAccount` entity shape frozen with canonical provider metadata + token lifecycle projection.
- [x] Legacy link fallback contracts `CreateLinkAccountRequest` and `CreateLinkAccountResponse` frozen.
- [x] OAuth connect contracts `ProviderConnectRequest` and `ProviderConnectResponse` frozen.
- [x] OAuth callback contracts `ProviderCallbackRequest` and `ProviderCallbackResponse` frozen.
- [x] `ListAccountsResponse` frozen.
- [x] `UnlinkAccountRequest` and `UnlinkAccountResponse` frozen.
- [x] `SetActiveAccountRequest` and `SetActiveAccountResponse` frozen.
- [x] `StorageAccountsErrorResponse` (shared `ApiError` envelope) frozen and reused across connect/link/callback/account routes.
- [x] Explicitly out of freeze scope: upload dispatch, explorer, and non-foundation contracts.
