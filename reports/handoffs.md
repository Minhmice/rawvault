# Handoffs

Central list of handoff requests (file paths, owner, change request, reason, test). Append when creating a handoff via `/handoff`; remove or mark done when the owner completes the work.

| File paths | Owner | Change request | Reason | Test / acceptance |
|------------|-------|----------------|--------|-------------------|
| (example) api/users/route.ts | backend-a | Add avatarUrl to response | FE needs field for profile | GET /api/users and check response |
| src/app/api/jobs/preview/run/route.ts | backend-a | When `SUPABASE_EDGE_FUNCTION_PREVIEW_URL` is unset, call in-process processor: `import { processPendingPreviewJobs } from "@/workers/preview/processor"; import { createSupabaseServerClient } from "@/lib/supabase"; await processPendingPreviewJobs(createSupabaseServerClient(), pendingJobs, requestId);` | Backend-b provides processor; route should invoke it for MVP without Edge Function | POST /api/jobs/preview/run after uploading a file; verify job completes and files get thumb/preview |

- **Ready to merge when:** No pending handoffs (all rows above resolved or removed).
