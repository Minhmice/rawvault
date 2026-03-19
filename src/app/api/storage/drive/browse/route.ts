import { handleRouteError, ok } from "@/lib/api/responses";
import {
  driveBrowseQuerySchema,
  driveBrowseResponseSchema,
} from "@/lib/contracts/drive-browse.contracts";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { browseDrive } from "@/lib/storage-accounts/browse.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

function parseQuery(searchParams: URLSearchParams) {
  const accountId = searchParams.get("accountId")?.trim();
  const folderId = searchParams.get("folderId")?.trim() || undefined;

  if (!accountId) {
    throw new ApiError(400, "VALIDATION_ERROR", "accountId is required for Drive browse.");
  }

  const parsed = driveBrowseQuerySchema.safeParse({
    accountId,
    folderId: folderId || undefined,
  });

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid query parameters.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(searchParams);

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const result = await browseDrive(supabase, user.id, {
      accountId: query.accountId,
      folderId: query.folderId ?? null,
    });

    const response = driveBrowseResponseSchema.parse({
      success: true,
      folders: result.folders,
      files: result.files,
    });

    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
