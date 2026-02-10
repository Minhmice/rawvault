import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";

/**
 * POST /api/jobs/preview/run
 * Trigger processing of pending preview jobs.
 * MVP: manual trigger or cron. Calls Edge Function / job processor.
 * Handoff to backend-b for actual processor; this route enqueues or invokes.
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const supabase = await getSupabaseServerClient();

  const { data: pendingJobs, error: fetchError } = await supabase
    .from("preview_jobs")
    .select("id, file_id, owner_id")
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .limit(10);

  if (fetchError) {
    log.error("Failed to fetch pending jobs", { errorCode: fetchError.message });
    return jsonError(500, "internal_error", "Failed to fetch jobs");
  }

  if (!pendingJobs?.length) {
    log.info("No pending preview jobs", { userId: user.id });
    return Response.json({ triggered: 0, message: "No pending jobs" });
  }

  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_PREVIEW_URL;
  if (edgeFunctionUrl) {
    for (const job of pendingJobs) {
      try {
        const res = await fetch(edgeFunctionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: job.id,
            fileId: job.file_id,
            ownerId: job.owner_id,
            requestId,
          }),
        });
        if (!res.ok) {
          log.warn("Edge function call failed", {
            jobId: job.id,
            status: res.status,
          });
        }
      } catch (e) {
        log.error("Edge function invocation error", {
          jobId: job.id,
          error: String(e),
        });
      }
    }
  } else {
    log.info("Preview job processor not configured; jobs queued", {
      jobIds: pendingJobs.map((j) => j.id),
      userId: user.id,
    });
  }

  log.info("Preview jobs triggered", {
    count: pendingJobs.length,
    requestId,
    userId: user.id,
  });

  return Response.json({
    triggered: pendingJobs.length,
    jobIds: pendingJobs.map((j) => j.id),
    message: edgeFunctionUrl
      ? "Jobs submitted to processor"
      : "Jobs queued (processor URL not configured)",
  });
}
