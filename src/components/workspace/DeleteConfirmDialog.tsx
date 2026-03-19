"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/theme/shadcn/dialog";
import { AppDialogContent } from "@/components/app/AppDialogContent";
import { AppDialogTitle } from "@/components/app/AppDialogTitle";
import { AppButton } from "@/components/app/AppButton";
import { useLocale } from "@/components/i18n/LocaleProvider";

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
      <AppDialogContent showCloseButton>
        <DialogHeader>
          <AppDialogTitle>{t("workspace.deleteConfirmTitle")}</AppDialogTitle>
          <DialogDescription>
            {t("workspace.deleteConfirmMessage").replace(/\{name\}/g, name)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t("common.cancel")}
          </AppButton>
          <AppButton type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? t("workspace.deleting") : t("workspace.delete")}
          </AppButton>
        </DialogFooter>
      </AppDialogContent>
    </Dialog>
  );
}
