"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { VaultActionsDropdown } from "@/components/workspace/VaultActionsDropdown";
import type { LinkedAccount } from "@/lib/contracts";

export type ExplorerContext = {
  accountId: string;
  providerFolderId: string | null;
};

type VaultHeaderProps = {
  createFolderOpen: boolean;
  onOpenChangeCreateFolder: (open: boolean) => void;
  onRefresh: () => void;
  accounts: LinkedAccount[];
  selectedFolderId: string | null;
  /** When in provider folder view, enables New Folder / Upload File+Folder in provider context. */
  explorerContext?: ExplorerContext | null;
};

export function VaultHeader({
  createFolderOpen,
  onOpenChangeCreateFolder,
  onRefresh,
  accounts,
  selectedFolderId,
  explorerContext,
}: VaultHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="flex w-full shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="animate-enter text-3xl font-heading font-bold uppercase tracking-widest text-foreground">
          {t("vault.myVault")}
        </h1>
        <p className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {t("vault.dataLoadedSubtitle")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <VaultActionsDropdown
          createFolderOpen={createFolderOpen}
          onOpenChangeCreateFolder={onOpenChangeCreateFolder}
          onRefresh={onRefresh}
          selectedFolderId={selectedFolderId}
          explorerContext={explorerContext}
        />
      </div>
    </div>
  );
}
