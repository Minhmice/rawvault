"use client";

import { useState } from "react";
import { Plus, FolderPlus, Upload, FolderInput } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/theme/shadcn/dropdown-menu";
import { buttonVariants } from "@/components/theme/shadcn/button";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { CreateFolderDialog } from "@/components/workspace/CreateFolderDialog";
import { UploadFileDialog } from "@/components/workspace/UploadFileDialog";
import { UploadFolderDialog } from "@/components/workspace/UploadFolderDialog";
import type { ExplorerContext } from "@/components/workspace/VaultHeader";

type VaultActionsDropdownProps = {
  createFolderOpen: boolean;
  onOpenChangeCreateFolder: (open: boolean) => void;
  onRefresh: () => void;
  selectedFolderId: string | null;
  /** When set, New Folder uses provider mode; Upload File/Folder open respective dialogs. */
  explorerContext?: ExplorerContext | null;
};

export function VaultActionsDropdown({
  createFolderOpen,
  onOpenChangeCreateFolder,
  onRefresh,
  selectedFolderId,
  explorerContext,
}: VaultActionsDropdownProps) {
  const { t } = useLocale();
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [uploadFolderOpen, setUploadFolderOpen] = useState(false);

  const effectiveExplorerContext =
    explorerContext?.accountId != null
      ? {
          accountId: explorerContext.accountId,
          providerFolderId: explorerContext.providerFolderId ?? null,
        }
      : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => {
            const { ref, ...rest } = props as React.ComponentPropsWithRef<"button">;
            return (
              <button
                type="button"
                ref={ref}
                {...rest}
                className={cn(
                  buttonVariants(),
                  "gap-2 font-mono uppercase tracking-wider shadow-none cursor-pointer"
                )}
              >
                <Plus className="h-4 w-4 stroke-[1.5px]" />
                {t("workspace.add")}
              </button>
            );
          }}
        />
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              onOpenChangeCreateFolder(true);
            }}
          >
            <FolderPlus className="h-4 w-4" />
            {t("workspace.newFolder")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setUploadFileOpen(true);
            }}
          >
            <Upload className="h-4 w-4" />
            {t("workspace.uploadFile")}
          </DropdownMenuItem>
          {effectiveExplorerContext != null && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setUploadFolderOpen(true);
              }}
            >
              <FolderInput className="h-4 w-4" />
              {t("workspace.uploadFolder")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={onOpenChangeCreateFolder}
        parentFolderId={selectedFolderId}
        onSuccess={onRefresh}
        explorerContext={effectiveExplorerContext}
      />

      <UploadFileDialog
        open={uploadFileOpen}
        onOpenChange={setUploadFileOpen}
        onSuccess={onRefresh}
        explorerContext={effectiveExplorerContext}
      />

      <UploadFolderDialog
        open={uploadFolderOpen}
        onOpenChange={setUploadFolderOpen}
        onSuccess={onRefresh}
        explorerContext={effectiveExplorerContext}
      />
    </>
  );
}
