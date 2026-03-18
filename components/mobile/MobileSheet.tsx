"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

export type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function MobileSheet({ open, onOpenChange, title, children, className }: MobileSheetProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t("common.cancel")}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute left-0 top-0 flex h-full w-[min(100vw,20rem)] max-w-[85vw] flex-col border-r border-rv-border bg-rv-bg shadow-xl animate-in slide-in-from-left duration-200",
          className
        )}
      >
        {title ? (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-rv-border px-3">
            <span className="text-sm font-semibold text-rv-text">{title}</span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text"
              aria-label={t("common.cancel")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
