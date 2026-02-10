import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import { rateLimitShare } from "@/lib/rate-limit";

type Params = Promise<{ fileId: string }>;

const SHARE_TTL_SEC = 30 * 60; // 15-60 min config; default 30 min

export async function POST(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const requestId = getOrCreateRequestId(_request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { ok } = rateLimitShare(user.id);
  if (!ok) {
    log.warn("Rate limit exceeded for share", { userId: user.id });
    return jsonError(429, "rate_limited", "Too many requests");
  }

  const { fileId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("storage_key_original, storage_key_preview, storage_key_thumb, owner_id")
    .eq("id", fileId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fileError || !file) {
    return jsonError(404, ErrorCodes.NOT_FOUND, "File not found");
  }

  const storageClient = createSupabaseServerClient();
  const bucket = "rawvault-original";
  const key = file.storage_key_original;

  const { data: signedData, error } = await storageClient.storage
    .from(bucket)
    .createSignedUrl(key, SHARE_TTL_SEC);

  if (error) {
    log.error("Failed to create share URL", {
      fileId,
      errorCode: error.message,
    });
    return jsonError(500, "internal_error", "Failed to create share link");
  }

  log.info("Share link created", { fileId, userId: user.id });

  return Response.json({
    link: signedData.signedUrl,
    expiresIn: SHARE_TTL_SEC,
  });
}
