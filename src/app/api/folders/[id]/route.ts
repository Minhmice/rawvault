import { ApiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { MoveFolderRequest, RenameFolderRequest } from "@/lib/contracts";
import {
  moveFolder,
  renameFolder,
  softDeleteFolder,
} from "@/lib/metadata/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody<Partial<RenameFolderRequest & MoveFolderRequest>>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    if (body.parentId !== undefined) {
      const moveResult = await moveFolder(supabase, user.id, id, {
        parentId: body.parentId,
      });
      if (body.name === undefined) return ok(moveResult);
    }
    if (body.name !== undefined) {
      const response = await renameFolder(supabase, user.id, id, {
        name: body.name,
      });
      return ok(response);
    }
    throw new ApiError(400, "VALIDATION_ERROR", "Request body must include 'name' or 'parentId'.");
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

    const response = await softDeleteFolder(supabase, user.id, id);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
