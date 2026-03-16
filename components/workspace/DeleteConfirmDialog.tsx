"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/theme/shadcn/dialog";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "file" | "folder";
  name: string;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  type,
  name,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useLocale();
  const { ThemeButton } = useThemeComponents();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border border-border" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-heading font-bold uppercase tracking-widest">
            {t("workspace.deleteConfirmTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("workspace.deleteConfirmMessage").replace(/\{name\}/g, name)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <ThemeButton type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t("common.cancel")}
          </ThemeButton>
          <ThemeButton type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? t("workspace.deleting") : t("workspace.delete")}
          </ThemeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
