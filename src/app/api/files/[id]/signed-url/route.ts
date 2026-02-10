import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import { SignedUrlQuerySchema } from "@/lib/validation";

type Params = Promise<{ id: string }>;

const EXPIRE_SEC = 3600; // 1 hour, configurable via env

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const parsed = SignedUrlQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { variant } = parsed.data;
  const supabase = await getSupabaseServerClient();
  const storageClient = createSupabaseServerClient();

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("storage_key_original, storage_key_thumb, storage_key_preview, owner_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fileError || !file) {
    return jsonError(404, ErrorCodes.NOT_FOUND, "File not found");
  }

  let key: string | null = null;
  let bucket = "rawvault-original";
  if (variant === "original") {
    key = file.storage_key_original;
  } else if (variant === "thumb") {
    key = file.storage_key_thumb;
    bucket = "rawvault-derivatives";
  } else if (variant === "preview") {
    key = file.storage_key_preview;
    bucket = "rawvault-derivatives";
  }

  if (!key) {
    return Response.json({ url: null, variant });
  }

  const { data: signedData, error } = await storageClient.storage
    .from(bucket)
    .createSignedUrl(key, EXPIRE_SEC);

  if (error) {
    log.error("Failed to create signed URL", {
      fileId: id,
      variant,
      errorCode: error.message,
    });
    return jsonError(500, "internal_error", "Failed to create signed URL");
  }

  return Response.json({ url: signedData.signedUrl, variant, expiresIn: EXPIRE_SEC });
}
