/**
 * Unified explorer list: merge provider-native browse results across linked accounts.
 * Used as main data source for My Drive and folder navigation (Phase 1).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { UnifiedExplorerItem, UnifiedExplorerListQuery } from "@/lib/contracts/explorer-list.contracts";
import { browseDrive } from "@/lib/storage-accounts/browse.service";

export async function getUnifiedExplorerList(
  supabase: SupabaseClient,
  userId: string,
  query: UnifiedExplorerListQuery,
): Promise<{ folders: UnifiedExplorerItem[]; files: UnifiedExplorerItem[] }> {
  const accountId = query.accountId;
  const providerFolderId = query.providerFolderId ?? null;

  if (accountId) {
    const result = await browseDrive(supabase, userId, {
      accountId,
      folderId: providerFolderId,
    });
    return {
      folders: result.folders.map((f) => ({
        accountId,
        providerId: f.id,
        name: f.name,
        isFolder: f.isFolder,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
      })),
      files: result.files.map((f) => ({
        accountId,
        providerId: f.id,
        name: f.name,
        isFolder: f.isFolder,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
      })),
    };
  }

  const { data: accounts, error } = await supabase
    .from("linked_accounts")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to load linked accounts");
  }

  const accountIds = (accounts ?? []).map((r: { id: string }) => r.id);
  const allFolders: UnifiedExplorerItem[] = [];
  const allFiles: UnifiedExplorerItem[] = [];

  for (const aid of accountIds) {
    try {
      const result = await browseDrive(supabase, userId, {
        accountId: aid,
        folderId: null,
      });
      allFolders.push(
        ...result.folders.map((f) => ({
          accountId: aid,
          providerId: f.id,
          name: f.name,
          isFolder: f.isFolder,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
        })),
      );
      allFiles.push(
        ...result.files.map((f) => ({
          accountId: aid,
          providerId: f.id,
          name: f.name,
          isFolder: f.isFolder,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
        })),
      );
    } catch {
      // Skip accounts that fail (e.g. token invalid)
    }
  }

  return { folders: allFolders, files: allFiles };
}
