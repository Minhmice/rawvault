import { NextRequest } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/auth";
import { jsonError, ErrorCodes } from "@/lib/api-error";
import { createLogger, getOrCreateRequestId } from "@/lib/logger";
import { CreateFolderBodySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger(requestId);

  const user = await getServerUser();
  if (!user) {
    return jsonError(401, ErrorCodes.UNAUTHORIZED, "Not authenticated");
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId") || undefined;

  const supabase = await getSupabaseServerClient();

  let q = supabase
    .from("folders")
    .select("id, name, parent_id, path, created_at, updated_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if (parentId === "root" || !parentId) {
    q = q.is("parent_id", null);
  } else {
    q = q.eq("parent_id", parentId);
  }

  const { data, error } = await q.order("name", { ascending: true });

  if (error) {
    log.error("Failed to list folders", { errorCode: error.message });
    return jsonError(500, "internal_error", "Failed to list folders");
  }

  return Response.json({ data: data ?? [] });
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

  const parsed = CreateFolderBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { parent_id, name, path } = parsed.data;
  const supabase = await getSupabaseServerClient();

  let pathValue = path;
  if (pathValue == null) {
    if (parent_id) {
      const { data: parent } = await supabase
        .from("folders")
        .select("path")
        .eq("id", parent_id)
        .eq("owner_id", user.id)
        .single();
      pathValue = parent?.path ? `${parent.path}/${name}` : `/${name}`;
    } else {
      pathValue = `/${name}`;
    }
  }

  const { data: folder, error } = await supabase
    .from("folders")
    .insert({
      owner_id: user.id,
      parent_id: parent_id ?? null,
      name,
      path: pathValue,
    })
    .select("id, name, parent_id, path, created_at")
    .single();

  if (error) {
    log.error("Failed to create folder", { errorCode: error.message });
    return jsonError(500, "internal_error", "Failed to create folder");
  }

  log.info("Folder created", { folderId: folder.id, userId: user.id });
  return Response.json(folder, { status: 201 });
}
