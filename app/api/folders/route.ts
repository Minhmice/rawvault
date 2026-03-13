import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { CreateFolderRequest } from "@/lib/contracts";
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
    const body = await parseJsonBody<CreateFolderRequest>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await createFolder(supabase, user.id, body);
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
