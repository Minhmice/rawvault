/**
 * Orchestrates browse Drive/OneDrive via provider adapters.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { getUsableProviderToken } from "@/lib/storage-accounts/oauth/token-lifecycle";
import { listGoogleDrive } from "@/lib/storage-accounts/drive/list.service";
import { listOneDrive } from "@/lib/storage-accounts/onedrive/list.service";

export type BrowseDriveInput = {
  accountId: string;
  folderId: string | null;
};

export async function browseDrive(
  supabase: SupabaseClient,
  userId: string,
  input: BrowseDriveInput,
) {
  const tokenResult = await getUsableProviderToken(
    supabase,
    userId,
    input.accountId,
  );

  const provider = tokenResult.provider;

  if (provider === "gdrive") {
    return listGoogleDrive({
      accessToken: tokenResult.accessToken,
      folderId: input.folderId,
    });
  }

  if (provider === "onedrive") {
    return listOneDrive({
      accessToken: tokenResult.accessToken,
      folderId: input.folderId,
    });
  }

  throw new ApiError(400, "VALIDATION_ERROR", "Invalid provider.", {
    provider,
  });
}
