# RAWVAULT PRD

## 1. Product Overview

**RawVault** is a drive-lite application for RAW photographers, focused on:
- File upload
- Folder management
- Asynchronous preview generation
- Secure sharing
- Using Google Drive and OneDrive as storage backends
- Storing only metadata and business state in Supabase
- Supporting multiple storage accounts under one user
- Expanding later into a customizable workspace and theme-driven experience

---

## 2. Product Goals

### Primary Goals
- Build a unified file management interface for users
- Do not store binary files in the app's own storage
- Use Google Drive and OneDrive to store originals, thumbnails, and previews
- Allow storage expansion through multiple linked accounts
- Support both development and production with Supabase as the app database
- Create a foundation for future workspace customization and theme systems

### Core Value
- Users do not need to know which provider stores a file
- The app presents a single unified library
- Upload routing is smart and policy-driven
- Share links are controlled at the app layer
- The platform can evolve into a highly personalized digital asset workspace

---

## 3. MVP Scope

### Included in MVP
- User management through Supabase Auth
- Folder and file metadata management
- Link / unlink Google Drive accounts
- Link / unlink OneDrive accounts
- Multiple storage accounts per user
- Upload through a storage adapter layer
- Route files to the most suitable account
- Unified explorer
- Preview status management
- Share links with TTL and revoke support
- Basic activity logging
- Per-account quota tracking
- Provider-aware download / stream
- Basic search / filter / sort
- Trash / restore
- Favorites / recent
- Basic batch operations
- Basic sync center
- Basic workspace customization through preset themes

### Not included in the first phase
- AI-assisted component generation
- Full AI workspace personalization
- Complex realtime collaboration
- OCR / advanced AI metadata extraction
- Public marketplace for themes and components

---

## 4. High-Level Architecture

## 4.1 App Database
Use **Supabase** to store:
- User data
- File / folder metadata
- Linked provider accounts
- Share links
- Preview jobs
- Activity logs
- Workspace preferences
- Favorites / recents / trash / versions / sync states

## 4.2 External Storage Providers
Use:
- Google Drive
- OneDrive

Responsibilities of providers:
- Store original files
- Store thumbnails / previews if needed
- Download / stream files
- Return provider-level metadata
- Manage quota, tokens, upload, and retry flows

## 4.3 Storage Adapter Layer
The app will have an adapter layer to:
- Abstract upload / download / share / resync
- Isolate provider-specific logic
- Support account failover
- Support mock/test adapters during development if needed

## 4.4 Job / Background Layer
Use background jobs / queues for:
- Preview generation
- Metadata refresh
- Provider resync
- Upload retries
- Preview retries
- Health checks
- Version sync
- Quota sync

---

## 5. Work Priorities and Functions by Implementation Order

# Phase 1 - Core foundation that must be solved first

## 5.1 Authentication and user foundation
### Functions
- Sign in / sign out with Supabase Auth
- Get current user profile
- Manage basic user profile
- Permission checks by `user_id`
- RLS for user-owned tables

## 5.2 App database metadata model
### Functions
- Store user metadata
- Store folder metadata
- Store file metadata
- Store linked storage account metadata
- Store share link metadata
- Store preview jobs
- Store activity logs
- Store workspace preferences
- Store favorites / recents / trash / versions / sync states

## 5.3 Link / unlink storage accounts
### Functions
- Connect Google Drive account
- Connect OneDrive account
- Unlink Google Drive account
- Unlink OneDrive account
- Show linked account list
- Show per-account quota
- Mark account as active / inactive
- Automatically refresh tokens
- Warn when token is invalid or near expiry

## 5.4 Folder and file metadata management
### Functions
- Create folder
- Rename folder
- Soft delete folder
- Restore folder
- Create file metadata record
- Update file metadata
- Soft delete file
- Restore file
- Move file to another folder
- Move folder into another folder
- Rename file
- List files by folder
- Get file details
- Get breadcrumb / path

## 5.5 Upload routing and storage dispatch
### Functions
- Select storage account for upload
- Prefer the account with the most remaining quota
- Fail over to another account when one is full
- Select provider by policy
- Select account by file size
- Select account by file type
- Write metadata after upload
- Assign `provider_file_id_original`
- Assign `provider_file_id_thumb`
- Assign `provider_file_id_preview`

## 5.6 Upload / download / stream adapter
### Functions
- Upload file to Google Drive
- Upload file to OneDrive
- Download file from Google Drive
- Download file from OneDrive
- Stream file from provider
- Redirect / proxy file access through app layer
- Retry upload on transient failure
- Retry with another account if upload fails

## 5.7 Unified explorer
### Functions
- Show one unified library
- Show folder tree
- Show file list
- Show provider badge for each file
- Show basic file info
- Show preview status
- Show basic sync status
- Open file viewer
- Open folder explorer

---

# Phase 2 - UX improvements that should come soon after core works

## 5.8 Search / filter / sort
### Functions
- Search by file name
- Search by extension
- Search by MIME type
- Search by folder
- Search by provider
- Search by created / modified date
- Search by file size
- Filter by file type
- Filter by provider
- Filter by preview status
- Sort by name
- Sort by modified date
- Sort by created date
- Sort by file size
- Save filter presets

## 5.9 Trash / restore / permanent delete
### Functions
- Move file to trash
- Move folder to trash
- View trash list
- Restore file from trash
- Restore folder from trash
- Permanently delete file
- Permanently delete folder
- Auto purge after a configured period
- Show original location before restore

## 5.10 Favorites / pin / recent
### Functions
- Mark file as favorite
- Mark folder as favorite
- Pin file
- Pin folder
- Show favorites list
- Show recent files list
- Show recent folders list
- Continue where you left off

## 5.11 Batch operations
### Functions
- Multi-select files
- Multi-select folders
- Bulk move
- Bulk delete
- Bulk restore
- Bulk share
- Bulk revoke share
- Bulk favorite
- Bulk unfavorite
- Bulk relink storage account
- Bulk retry preview
- Bulk retry sync

## 5.12 Basic share system
### Functions
- Create share link for file
- Create share link for folder
- Validate share token
- Apply TTL to share link
- Revoke share link
- Allow / disallow download
- Track share access
- Stream file through app layer after token validation
- Show created share links

## 5.13 Preview management
### Functions
- Create preview job
- Mark preview as pending
- Mark preview as processing
- Mark preview as ready
- Mark preview as failed
- Retry preview job
- Store `last_error_code`
- Show preview status in UI
- Viewer reads thumbnail / preview from provider

---

# Phase 3 - Operational stability and production readiness

## 5.14 Sync center / provider health
### Functions
- Show token expired state
- Show provider unavailable state
- Show preview failed state
- Show sync pending state
- Show stale metadata state
- Show account almost full state
- Retry sync for a single item
- Retry all sync jobs
- Resync metadata by account
- Resync metadata by file
- Resync metadata by folder
- Resync quota
- Resync provider health

## 5.15 Smart upload policy engine
### Functions
- Account selection rule by quota
- Account selection rule by file type
- Account selection rule by file size
- Preferred provider rule
- Skip accounts with poor health
- Fail over to another provider
- Manual account override
- Manual provider override
- Show routing reason
- Store routing history

## 5.16 Activity log and audit
### Functions
- Log upload
- Log delete
- Log restore
- Log rename
- Log move
- Log share creation
- Log share revoke
- Log provider link / unlink
- Log sync errors
- Log download access
- Show activity timeline

## 5.17 Security hardening
### Functions
- Encrypt provider tokens in database
- Never expose access tokens to client
- Check permissions before every file / share action
- Rate limit link endpoints
- Rate limit upload endpoints
- Rate limit share endpoints
- Rate limit download endpoints
- Track suspicious access
- Revoke account access
- Revoke share links in bulk

## 5.18 Provider conflict and resilience
### Functions
- Detect stale file metadata
- Detect missing provider file
- Mark orphaned metadata
- Mark conflict state
- Retry with another provider if a backup copy exists
- Let user resolve conflict
- Auto-fix path / metadata when provider changes
- Warn when file is temporarily unavailable

---

# Phase 4 - Higher-value features for file-heavy workflows

## 5.19 File versioning
### Functions
- Create new version metadata when a file changes
- Store version list
- View version history
- Revert to older version
- Show provider/account for each version
- Show version creation date
- Mark current version
- Mark failed version sync
- Compare basic version info

## 5.20 Metadata enrichment
### Functions
- Read EXIF metadata
- Read dimensions
- Read camera model
- Read lens info
- Read ISO / shutter / aperture when available
- Store enriched metadata in database
- Search by metadata
- Filter by metadata
- Add custom tags
- Create collections
- Add labels to files
- Filter by labels / tags / collections

## 5.21 Collections and organization layer
### Functions
- Create collection
- Add file to collection
- Remove file from collection
- Create smart collection by filter
- Show collection view
- Share collection
- Pin collection
- Favorite collection

---

# Phase 5 - Workspace customization, can be started earlier if differentiation is a priority

## 5.22 Theme presets
### Functions
- Select global theme
- Select color preset
- Select typography preset
- Select density preset
- Select icon style preset
- Preview theme before applying
- Save theme preference per user
- Reset to default theme

## 5.23 Component-level customization
### Functions
- Choose sidebar style
- Choose topbar style
- Choose file card style
- Choose folder card style
- Choose modal style
- Choose explorer layout style
- Choose viewer layout style
- Choose action button style
- Choose context menu style
- Choose animation preset per component
- Save component config per user

## 5.24 Workspace layout customization
### Functions
- Choose grid layout
- Choose list layout
- Choose compact list layout
- Choose split preview layout
- Choose focus mode
- Choose sidebar width
- Choose panel arrangement
- Choose quick actions layout
- Save workspace preferences
- Create custom workspace preset
- Reset workspace to default

## 5.25 Theme library expansion
### Functions
- Support many themes per component
- Theme pack by style
- Theme pack by workflow
- Theme pack by dark / light mode
- Import / export theme config
- Duplicate theme config
- Rename custom theme
- Delete custom theme

---

# Phase 6 - Hardest items, placed at the end of the roadmap

## 5.26 AI-assisted workspace personalization
### Functions
- AI suggests workspace based on user behavior
- AI suggests best-fit explorer layout
- AI suggests best-fit theme
- AI suggests quick actions for workflow
- AI suggests organization rules

## 5.27 AI-assisted component generation
### Functions
- AI generates component variants
- AI generates animation presets
- AI generates custom card layout
- AI generates custom panel layout
- AI generates custom UI block from user prompt
- AI suggests personalized component system
- AI maps style preferences into theme config
- AI generates full workspace preset

> Note: this section is placed at the end of the roadmap because it has high complexity and requires a very stable design system and component architecture first.

---

## 6. Proposed Database Schema

### `users`
- `id`
- `email`
- `display_name`
- `avatar_url`
- `created_at`
- `updated_at`

### `linked_accounts`
- `id`
- `user_id`
- `provider` (`gdrive|onedrive`)
- `provider_account_id`
- `account_email`
- `access_token_encrypted`
- `refresh_token_encrypted`
- `expires_at`
- `quota_total_bytes`
- `quota_used_bytes`
- `is_active`
- `health_status`
- `last_synced_at`
- `created_at`
- `updated_at`

### `folders`
- `id`
- `user_id`
- `parent_id`
- `name`
- `path`
- `is_favorite`
- `is_pinned`
- `deleted_at`
- `created_at`
- `updated_at`

### `files`
- `id`
- `user_id`
- `folder_id`
- `name`
- `ext`
- `mime`
- `size_bytes`
- `storage_provider`
- `storage_account_id`
- `provider_file_id_original`
- `provider_file_id_thumb`
- `provider_file_id_preview`
- `preview_status`
- `sync_status`
- `error_code`
- `metadata`
- `is_favorite`
- `is_pinned`
- `deleted_at`
- `created_at`
- `updated_at`

### `preview_jobs`
- `id`
- `file_id`
- `user_id`
- `status`
- `attempts`
- `last_error_code`
- `created_at`
- `updated_at`

### `share_links`
- `id`
- `user_id`
- `resource_type` (`file|folder|collection`)
- `resource_id`
- `token`
- `expires_at`
- `allow_download`
- `revoked_at`
- `created_at`

### `activity_logs`
- `id`
- `user_id`
- `action`
- `resource_type`
- `resource_id`
- `payload`
- `created_at`

### `file_versions`
- `id`
- `file_id`
- `version_no`
- `storage_provider`
- `storage_account_id`
- `provider_file_id`
- `metadata`
- `created_at`

### `favorites`
- `id`
- `user_id`
- `resource_type`
- `resource_id`
- `created_at`

### `recents`
- `id`
- `user_id`
- `resource_type`
- `resource_id`
- `last_opened_at`

### `workspace_preferences`
- `id`
- `user_id`
- `theme_id`
- `layout_mode`
- `component_config`
- `animation_config`
- `created_at`
- `updated_at`

### `collections`
- `id`
- `user_id`
- `name`
- `description`
- `created_at`
- `updated_at`

### `collection_items`
- `id`
- `collection_id`
- `file_id`
- `created_at`

---

## 7. Proposed API Contracts

### Storage accounts
- `POST /api/storage/accounts/link`
- `POST /api/storage/accounts/unlink`
- `GET /api/storage/accounts`
- `POST /api/storage/accounts/refresh`
- `POST /api/storage/accounts/set-active`

### Upload / download
- `POST /api/uploads/dispatch`
- `POST /api/providers/google/upload`
- `POST /api/providers/onedrive/upload`
- `GET /api/files/:id/download`
- `GET /api/files/:id/stream`

### Explorer
- `GET /api/folders`
- `POST /api/folders`
- `PATCH /api/folders/:id`
- `DELETE /api/folders/:id`
- `GET /api/files`
- `GET /api/files/:id`
- `PATCH /api/files/:id`
- `DELETE /api/files/:id`

### Search / filter / sort
- `GET /api/search/files`
- `GET /api/search/folders`
- `POST /api/search/saved`

### Trash
- `GET /api/trash`
- `POST /api/trash/restore`
- `DELETE /api/trash/purge`

### Favorites / recents
- `POST /api/favorites`
- `DELETE /api/favorites/:id`
- `GET /api/favorites`
- `GET /api/recents`

### Batch operations
- `POST /api/batch/move`
- `POST /api/batch/delete`
- `POST /api/batch/restore`
- `POST /api/batch/share`
- `POST /api/batch/retry`

### Share
- `POST /api/share-links`
- `GET /api/share-links`
- `DELETE /api/share-links/:id`
- `GET /s/:token`

### Preview / sync
- `POST /api/previews/retry`
- `POST /api/storage/resync`
- `GET /api/sync/status`
- `POST /api/sync/retry`

### Themes / workspace
- `GET /api/themes`
- `POST /api/themes/apply`
- `GET /api/workspace/preferences`
- `PATCH /api/workspace/preferences`
- `POST /api/workspace/presets`

### AI customization
- `POST /api/ai/workspace/suggest`
- `POST /api/ai/component/generate`
- `POST /api/ai/theme/generate`

---

## 8. Security

### Security Goals
- Encrypt access tokens and refresh tokens in the database
- Never expose provider tokens to the client
- Every file / folder / share action must check `user_id`
- Use RLS for Supabase tables
- Rate limit link / upload / share / download endpoints
- Keep audit logs for important actions
- Support fast account revoke and share revoke

---

## 9. Definition of Done by Priority

## DoD for core MVP
1. User can sign in
2. User can link Google Drive or OneDrive
3. User can create / update / soft delete folder and file metadata
4. File upload is routed to a linked account
5. System fails over when an account is full
6. Explorer shows unified files / folders
7. File download / stream uses the correct provider
8. Share links can be created and revoked
9. Preview status is visible
10. Basic search / filter / sort works

## DoD for UX enhancement
1. Trash / restore exists
2. Favorites / recent exists
3. Basic batch operations exist
4. Basic sync center exists
5. Basic provider health warnings exist

## DoD for production readiness
1. Smart upload policy exists
2. Audit logs exist
3. Rate limiting exists
4. Provider conflict state exists
5. Token refresh and account health monitoring exist

## DoD for customization
1. User can change theme
2. User can change layout
3. User can change key component styles
4. User can save workspace preferences
5. Theme presets and component presets are extensible

## DoD for AI roadmap
1. AI can suggest workspace config
2. AI can suggest theme / layout
3. AI can generate component variant / animation preset
4. AI results can be saved as reusable config

---

## 10. Recommended Implementation Order

### Priority 1
- Auth
- Database schema
- Linked accounts
- Folder / file metadata
- Upload routing
- Provider adapters
- Unified explorer

### Priority 2
- Search / filter / sort
- Trash / restore
- Favorites / recent
- Share system
- Preview management

### Priority 3
- Batch operations
- Sync center
- Provider health
- Smart upload policy
- Audit / security hardening

### Priority 4
- File versioning
- Metadata enrichment
- Collections

### Priority 5
- Theme presets
- Component-level customization
- Workspace customization
- Theme library expansion

### Priority 6
- AI-assisted workspace personalization
- AI-assisted component generation

---

## 11. Conclusion

RawVault already has a strong and logical product direction for a modern drive-lite platform:
- App database manages metadata
- Google Drive / OneDrive store binaries
- Supabase powers auth + database + policy
- Storage can scale through multi-account support
- The app can grow into a highly personalized workspace manager

Recommended priority:
1. Make core storage and explorer truly stable
2. Add essential UX for daily use
3. Add sync / health / security for production readiness
4. Expand file intelligence
5. Push workspace customization and AI-generated components later