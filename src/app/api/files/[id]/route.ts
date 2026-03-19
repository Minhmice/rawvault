import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getExplorerFile } from "@/lib/explorer/service";
import type { MoveFileRequest, RenameFileRequest } from "@/lib/contracts";
import {
  moveFile,
  renameFile,
  softDeleteFile,
} from "@/lib/metadata/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await getExplorerFile(supabase, user.id, { id });
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody<Partial<RenameFileRequest & MoveFileRequest>>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    if (body.name === undefined && body.folderId === undefined) {
      const { ApiError } = await import("@/lib/api/errors");
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must include 'name' or 'folderId'.");
    }
    let response;
    if (body.folderId !== undefined) {
      response = await moveFile(supabase, user.id, id, {
        folderId: body.folderId,
      });
    }
    if (body.name !== undefined) {
      response = await renameFile(supabase, user.id, id, {
        name: body.name,
      });
    }
    return ok(response!);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await softDeleteFile(supabase, user.id, id);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
