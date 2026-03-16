"use client";

import { useState, useCallback } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/theme/shadcn/dialog";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";
import { UPLOAD_EXECUTE_FORM_KEYS } from "@/lib/contracts";

export type UploadFolderExplorerContext = {
  accountId: string;
  providerFolderId: string | null;
};

type UploadFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Required for MVP: create folder and upload files into this context. */
  explorerContext: UploadFolderExplorerContext | null;
};

export function UploadFolderDialog({
  open,
  onOpenChange,
  onSuccess,
  explorerContext,
}: UploadFolderDialogProps) {
  const { t } = useLocale();
  const { ThemeButton, ThemeInput } = useThemeComponents();
  const [folderName, setFolderName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setError(null);
        setFolderName("");
        setFiles([]);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleFolderPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) {
      setFiles([]);
      return;
    }
    const arr = Array.from(list);
    setFiles(arr);
    if (!folderName && arr[0]?.webkitRelativePath) {
      const topDir = arr[0].webkitRelativePath.split("/")[0];
      if (topDir) setFolderName(topDir);
    }
    if (!folderName && arr.length > 0) setFolderName("New folder");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || !explorerContext?.accountId) return;
    const name = folderName.trim() || "New folder";
    if (files.length === 0) {
      setError(t("workspace.selectFileRequired"));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const createRes = await fetch("/api/explorer/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: explorerContext.accountId,
          providerFolderId: explorerContext.providerFolderId ?? null,
          name,
        }),
        credentials: "include",
      });
      const createData = (await createRes.json().catch(() => null)) as
        | { success?: boolean; providerFolderId?: string }
        | null;
      if (!createRes.ok || !createData?.providerFolderId) {
        const message =
          createData &&
          typeof createData === "object" &&
          "error" in createData &&
          createData.error &&
          typeof (createData as { error?: { message?: string } }).error === "object"
            ? (createData as { error: { message?: string } }).error?.message
            : `Request failed (${createRes.status}).`;
        throw new Error(message);
      }
      const newProviderFolderId = createData.providerFolderId;

      for (const file of files) {
        const formData = new FormData();
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.file, file);
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.fileName, file.name);
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.sizeBytes, String(file.size));
        formData.append(
          UPLOAD_EXECUTE_FORM_KEYS.mime,
          file.type || "application/octet-stream"
        );
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.accountId, explorerContext.accountId);
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.providerFolderId, newProviderFolderId);

        const res = await fetch("/api/uploads/execute", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            data?.error?.message ?? `Upload failed for ${file.name} (${res.status}).`;
          throw new Error(msg);
        }
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("workspace.uploadFailed")
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle
            id="upload-folder-title"
            className="font-heading font-bold uppercase tracking-widest"
          >
            {t("workspace.uploadFolder")}
          </DialogTitle>
          <DialogDescription id="upload-folder-description">
            {t("workspace.uploadFolderDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="upload-folder-name"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("workspace.folderName")}
            </label>
            <ThemeInput
              id="upload-folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t("workspace.folderNamePlaceholder")}
              autoComplete="off"
              disabled={uploading}
            />
          </div>
          <div>
            <label
              htmlFor="upload-folder-input"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("workspace.uploadFolderPickFiles")}
            </label>
            <ThemeInput
              id="upload-folder-input"
              type="file"
              // @ts-expect-error webkitdirectory is non-standard but supported
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderPick}
              disabled={uploading}
              aria-describedby="upload-folder-description"
              className="cursor-pointer"
            />
            {files.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {files.length} {t("workspace.filesCount")}
              </p>
            )}
          </div>

          {error && (
            <p
              id="upload-folder-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <ThemeButton
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={uploading}
            >
              {t("common.cancel")}
            </ThemeButton>
            <ThemeButton
              type="submit"
              disabled={uploading || files.length === 0}
            >
              {uploading ? t("workspace.uploading") : t("workspace.upload")}
            </ThemeButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
