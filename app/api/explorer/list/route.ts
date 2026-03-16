/**
 * Unified explorer list: provider-native folders and files for My Drive or a single folder.
 * GET /api/explorer/list?accountId=&providerFolderId=
 * When both omitted: My Drive (all linked accounts) merged.
 */

import { handleRouteError, ok } from "@/lib/api/responses";
import {
  unifiedExplorerListQuerySchema,
  unifiedExplorerListResponseSchema,
} from "@/lib/contracts/explorer-list.contracts";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getUnifiedExplorerList } from "@/lib/explorer/unified-list.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = unifiedExplorerListQuerySchema.safeParse({
      accountId: searchParams.get("accountId") ?? undefined,
      providerFolderId: searchParams.get("providerFolderId") ?? undefined,
    });
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid query.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const { folders, files } = await getUnifiedExplorerList(
      supabase,
      user.id,
      parsed.data,
    );

    const response = unifiedExplorerListResponseSchema.parse({
      success: true as const,
      folders,
      files,
    });
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
