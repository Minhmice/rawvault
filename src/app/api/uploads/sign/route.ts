import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import { SignUploadBodySchema } from "@/lib/validation";
import { rateLimitSign } from "@/lib/rate-limit";

const SIGNED_URL_EXPIRES_SEC = 2 * 60 * 60; // 2 hours

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    log.warn("Upload sign attempted without auth", { errorCode: ErrorCodes.UNAUTHORIZED });
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { ok } = rateLimitSign(user.id);
  if (!ok) {
    log.warn("Rate limit exceeded for upload sign", { userId: user.id });
    return jsonError(429, "rate_limited", "Too many requests");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, ErrorCodes.VALIDATION, "Invalid JSON body");
  }

  const parsed = SignUploadBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { folderId, files } = parsed.data;
  const supabase = createSupabaseServerClient();
  const bucket = "rawvault-original";

  const urls: { name: string; url: string; key: string }[] = [];
  for (const f of files) {
    const ext = f.name.split(".").pop() || "bin";
    const key = `${user.id}/${folderId}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(key, {
        upsert: false,
      });

    if (error) {
      log.error("Failed to create signed upload URL", {
        key,
        errorCode: error.message,
      });
      return jsonError(500, "internal_error", "Failed to create signed URL");
    }

    urls.push({ name: f.name, url: data.signedUrl, key });
  }

  log.info("Upload sign success", {
    folderId,
    fileCount: files.length,
    userId: user.id,
  });

  return Response.json({
    urls,
    expiresIn: SIGNED_URL_EXPIRES_SEC,
  });
}
