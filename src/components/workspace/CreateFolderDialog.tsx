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
import type { CreateFolderRequest } from "@/lib/contracts";

export type CreateFolderExplorerContext = {
  accountId: string;
  providerFolderId: string | null;
};

type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolderId?: string | null;
  onSuccess: () => void;
  creatingFolder?: boolean;
  /** When set, create folder on provider via POST /api/explorer/folder. */
  explorerContext?: CreateFolderExplorerContext | null;
};


export function CreateFolderDialog({
  open,
  onOpenChange,
  parentFolderId,
  onSuccess,
  creatingFolder: externalCreating = false,
  explorerContext,
}: CreateFolderDialogProps) {
  const { t } = useLocale();
  const { ThemeButton, ThemeInput } = useThemeComponents();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isCreating = externalCreating || creating;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setError(null);
        setName("");
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("workspace.folderNameRequired"));
      return;
    }

    setError(null);
    setCreating(true);

    try {
      if (explorerContext?.accountId) {
        const res = await fetch("/api/explorer/folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: explorerContext.accountId,
            providerFolderId: explorerContext.providerFolderId ?? null,
            name: trimmed,
          }),
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
      } else {
        const payload: CreateFolderRequest = {
          name: trimmed,
          parentId: parentFolderId ?? undefined,
        };
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("workspace.failedToCreateFolder"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle
            id="create-folder-title"
            className="font-heading font-bold uppercase tracking-widest"
          >
            {t("workspace.newFolder")}
          </DialogTitle>
          <DialogDescription id="create-folder-description">
            {t("workspace.createFolderDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="create-folder-name"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("workspace.folderName")}
            </label>
            <ThemeInput
              id="create-folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("workspace.folderNamePlaceholder")}
              autoComplete="off"
              disabled={isCreating}
              aria-invalid={!!error}
              aria-describedby={error ? "create-folder-error" : "create-folder-description"}
            />
          </div>

          {error && (
            <p
              id="create-folder-error"
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
              disabled={isCreating}
            >
              {t("common.cancel")}
            </ThemeButton>
            <ThemeButton type="submit" disabled={isCreating}>
              {isCreating ? t("workspace.creating") : t("workspace.create")}
            </ThemeButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
