"use client";

import { useState, useCallback, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/theme/shadcn/dialog";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";

type RenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "file" | "folder";
  id: string;
  currentName: string;
  onSuccess: () => void;
};


export function RenameDialog({
  open,
  onOpenChange,
  type,
  id,
  currentName,
  onSuccess,
}: RenameDialogProps) {
  const { t } = useLocale();
  const { ThemeButton, ThemeInput } = useThemeComponents();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setError(null);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(type === "file" ? t("workspace.fileNameRequired") : t("workspace.folderNameRequiredRename"));
      return;
    }
    if (trimmed === currentName) {
      handleOpenChange(false);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const url = type === "file" ? `/api/files/${id}` : `/api/folders/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;

      if (!res.ok) {
        const msg = data?.error?.message ?? `Request failed (${res.status})`;
        throw new Error(msg);
      }
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("workspace.failedToRename"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border border-border" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-heading font-bold uppercase tracking-widest">
            {type === "file" ? t("workspace.renameFileTitle") : t("workspace.renameFolderTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("workspace.renameDescription").replace(/\{name\}/g, currentName)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <ThemeInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "file" ? t("workspace.fileNamePlaceholder") : t("workspace.folderNamePlaceholderRename")}
            aria-label={type === "file" ? t("workspace.fileNamePlaceholder") : t("workspace.folderNamePlaceholderRename")}
            disabled={saving}
            autoFocus
            className="font-medium"
          />
          <div className="flex justify-end gap-2">
            <ThemeButton type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              {t("common.cancel")}
            </ThemeButton>
            <ThemeButton type="submit" disabled={saving}>
              {saving ? t("workspace.saving") : t("workspace.save")}
            </ThemeButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
