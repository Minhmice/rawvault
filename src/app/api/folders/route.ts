import { ApiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createFolderRequestSchema } from "@/lib/contracts/metadata.contracts";
import { listExplorerFolders, parseFoldersQuery } from "@/lib/explorer/service";
import { createFolder } from "@/lib/metadata/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const query = parseFoldersQuery(new URL(request.url).searchParams);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await listExplorerFolders(supabase, user.id, query);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must be an object.");
    }
    const parsed = createFolderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid create folder request.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await createFolder(supabase, user.id, parsed.data);
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
