"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export type ActionSheetAction = {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  variant?: "default" | "destructive";
  icon?: ReactNode;
};

export type ActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  actions: ActionSheetAction[];
};

export function ActionSheet({ open, onOpenChange, title, actions }: ActionSheetProps) {
  const { t } = useLocale();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label={title ?? t("mobile.actions")}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("mobile.cancel")}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-rv-border bg-rv-bg p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg animate-in slide-in-from-bottom duration-200 md:hidden"
        )}
      >
        {title ? (
          <p className="border-b border-rv-border px-3 py-2 text-center text-sm font-semibold text-rv-text">{title}</p>
        ) : null}
        <ul className="mt-1 space-y-0.5" role="menu">
          {actions.map((a) => (
            <li key={a.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                  a.variant === "destructive"
                    ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    : "text-rv-text hover:bg-rv-surface-muted"
                )}
                onClick={() => {
                  a.onSelect();
                  onOpenChange(false);
                }}
              >
                {a.icon ? <span className="shrink-0">{a.icon}</span> : null}
                {a.label}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 w-full rounded-xl border border-rv-border py-3 text-sm font-medium text-rv-text-muted hover:bg-rv-surface-muted"
          onClick={() => onOpenChange(false)}
        >
          {t("mobile.cancel")}
        </button>
      </div>
    </div>
  );
}
