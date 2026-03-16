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

export type UploadFileExplorerContext = {
  accountId: string;
  providerFolderId: string | null;
};

type UploadFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When set, upload into this provider folder (FormData accountId, providerFolderId). */
  explorerContext?: UploadFileExplorerContext | null;
};

export function UploadFileDialog({
  open,
  onOpenChange,
  onSuccess,
  explorerContext,
}: UploadFileDialogProps) {
  const { t } = useLocale();
  const { ThemeButton, ThemeInput } = useThemeComponents();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setError(null);
        setFile(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || !file) {
      if (!file) setError(t("workspace.selectFileRequired"));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.file, file);
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.fileName, file.name);
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.sizeBytes, String(file.size));
      formData.append(
        UPLOAD_EXECUTE_FORM_KEYS.mime,
        file.type || "application/octet-stream"
      );
      if (explorerContext?.accountId) {
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.accountId, explorerContext.accountId);
        formData.append(
          UPLOAD_EXECUTE_FORM_KEYS.providerFolderId,
          explorerContext.providerFolderId ?? ""
        );
      }

      const res = await fetch("/api/uploads/execute", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data &&
          typeof data === "object" &&
          data.error &&
          typeof data.error === "object" &&
          typeof data.error.message === "string"
            ? data.error.message
            : `Request failed (${res.status}).`;
        throw new Error(message);
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
            id="upload-file-title"
            className="font-heading font-bold uppercase tracking-widest"
          >
            {t("workspace.uploadFile")}
          </DialogTitle>
          <DialogDescription id="upload-file-description">
            {t("workspace.uploadFileDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="upload-file-input"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("workspace.file")}
            </label>
            <ThemeInput
              id="upload-file-input"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
                setError(null);
              }}
              disabled={uploading}
              aria-invalid={!!error}
              aria-describedby={
                error ? "upload-file-error" : "upload-file-description"
              }
              className="cursor-pointer"
            />
            {file && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {file.name} ({formatBytes(file.size)})
              </p>
            )}
          </div>

          {error && (
            <p
              id="upload-file-error"
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
            <ThemeButton type="submit" disabled={uploading || !file}>
              {uploading ? t("workspace.uploading") : t("workspace.upload")}
            </ThemeButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`;
}
