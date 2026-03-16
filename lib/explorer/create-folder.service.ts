/**
 * Create a folder on the provider (Google Drive or OneDrive) in the current context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { getUsableProviderToken } from "@/lib/storage-accounts/oauth/token-lifecycle";
import { createFolderOnGoogleDrive } from "@/lib/storage-accounts/drive/create-folder.service";
import { createFolderOnOneDrive } from "@/lib/storage-accounts/onedrive/create-folder.service";

export type CreateExplorerFolderInput = {
  accountId: string;
  providerFolderId: string | null;
  name: string;
};

export async function createFolderOnProvider(
  supabase: SupabaseClient,
  userId: string,
  input: CreateExplorerFolderInput,
): Promise<{ providerFolderId: string }> {
  const tokenResult = await getUsableProviderToken(
    supabase,
    userId,
    input.accountId,
  );

  const provider = tokenResult.provider as AccountProvider;

  if (provider === "gdrive") {
    const result = await createFolderOnGoogleDrive({
      accessToken: tokenResult.accessToken,
      parentFolderId: input.providerFolderId,
      name: input.name,
    });
    return { providerFolderId: result.providerFolderId };
  }

  if (provider === "onedrive") {
    const result = await createFolderOnOneDrive({
      accessToken: tokenResult.accessToken,
      parentFolderId: input.providerFolderId,
      name: input.name,
    });
    return { providerFolderId: result.providerFolderId };
  }

  throw new ApiError(400, "VALIDATION_ERROR", "Unsupported provider.", {
    provider,
  });
}
