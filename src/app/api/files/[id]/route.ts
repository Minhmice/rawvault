import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import { PatchFileBodySchema } from "@/lib/validation";

type Params = Promise<{ id: string }>;

export async function PATCH(
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, ErrorCodes.VALIDATION, "Invalid JSON body");
  }

  const parsed = PatchFileBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const supabase = await getSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.folderId !== undefined) updates.folder_id = parsed.data.folderId;

  if (Object.keys(updates).length === 0) {
    return jsonError(400, ErrorCodes.VALIDATION, "No valid updates provided");
  }

  const { data, error } = await supabase
    .from("files")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .select("id, name, folder_id, updated_at")
    .single();

  if (error) {
    log.error("Failed to update file", { fileId: id, errorCode: error.message });
    return jsonError(500, "internal_error", "Failed to update file");
  }

  if (!data) {
    return jsonError(404, ErrorCodes.NOT_FOUND, "File not found");
  }

  log.info("File updated", { fileId: id, userId: user.id });
  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const requestId = getOrCreateRequestId(_request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    log.error("Failed to delete file", { fileId: id, errorCode: error.message });
    return jsonError(500, "internal_error", "Failed to delete file");
  }

  if (!data) {
    return jsonError(404, ErrorCodes.NOT_FOUND, "File not found");
  }

  log.info("File soft-deleted", { fileId: id, userId: user.id });
  return new Response(null, { status: 204 });
}
