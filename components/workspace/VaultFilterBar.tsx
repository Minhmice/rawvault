"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AccountProvider } from "@/lib/contracts";

export type ProviderFilter = AccountProvider | "all";

type VaultFilterBarProps = {
  value: ProviderFilter;
  onChange: (value: ProviderFilter) => void;
};

export function VaultFilterBar({ value, onChange }: VaultFilterBarProps) {
  const { t } = useLocale();

  return (
    <div
      className="flex w-full shrink-0 flex-wrap items-center gap-3 border-b border-border pb-4"
      role="group"
      aria-label={t("workspace.filterByProviderAndPreview")}
    >
      <div className="flex items-center gap-3" role="group" aria-label={t("workspace.providerFilter")}>
        {(["all", "gdrive", "onedrive"] as const).map((provider) => {
          const active = value === provider;
          const label =
            provider === "all"
              ? t("vault.allFiles")
              : provider === "gdrive"
                ? t("vault.googleDrive")
                : t("vault.oneDrive");
          return (
            <button
              key={provider}
              type="button"
              className={`cursor-pointer border-b-2 px-1 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-100 ${
                active
                  ? "border-foreground font-bold text-foreground"
                  : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
              onClick={() => onChange(provider)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
