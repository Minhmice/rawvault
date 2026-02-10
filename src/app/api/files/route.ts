import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import {
  CreateFileBodySchema,
  ListFilesQuerySchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  const parsed = ListFilesQuerySchema.safeParse(query);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { folderId, limit, offset, sort, order, type } = parsed.data;
  const supabase = await getSupabaseServerClient();

  let q = supabase
    .from("files")
    .select("id, name, ext, mime, size_bytes, preview_status, error_code, created_at, updated_at, folder_id", {
      count: "exact",
    })
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if (folderId) q = q.eq("folder_id", folderId);
  if (type) q = q.or(`ext.eq.${type},mime.ilike.${type}%`);

  q = q.order(sort, { ascending: order === "asc" });
  const { data, error, count } = await q.range(offset, offset + limit - 1);

  if (error) {
    log.error("Failed to list files", { errorCode: error.message });
    return jsonError(500, "internal_error", "Failed to list files");
  }

  const total = count ?? 0;
  const hasMore = offset + (data?.length ?? 0) < total;

  return Response.json({ data: data ?? [], total, hasMore });
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, ErrorCodes.VALIDATION, "Invalid JSON body");
  }

  const parsed = CreateFileBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { folderId, name, ext, mime, size_bytes, storage_key_original } = parsed.data;
  const supabase = await getSupabaseServerClient();

  const { data: file, error: fileError } = await supabase
    .from("files")
    .insert({
      owner_id: user.id,
      folder_id: folderId,
      name,
      ext,
      mime,
      size_bytes,
      storage_key_original,
      preview_status: "pending",
    })
    .select("id, name, ext, preview_status, created_at")
    .single();

  if (fileError) {
    log.error("Failed to insert file metadata", { errorCode: fileError.message });
    return jsonError(500, "internal_error", "Failed to create file");
  }

  const { error: jobError } = await supabase.from("preview_jobs").insert({
    file_id: file.id,
    owner_id: user.id,
    status: "pending",
    attempts: 0,
  });

  if (jobError) {
    log.warn("File created but preview_job insert failed", {
      fileId: file.id,
      errorCode: jobError.message,
    });
  }

  log.info("File metadata inserted and preview job created", {
    fileId: file.id,
    userId: user.id,
  });

  return Response.json(file, { status: 201 });
}
