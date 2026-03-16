"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, HardDrive, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/theme/shadcn/dialog";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

const DIALOG_THEME = {
  vivid: {
    content: "sm:max-w-md border-rv-border bg-rv-surface shadow-xl",
    card: "group flex items-center gap-4 rounded-xl border border-rv-border bg-rv-surface p-4 transition-all duration-300 hover:border-rv-primary/40 hover:shadow-md hover:shadow-rv-primary/10",
    cardIcon: "text-rv-primary",
  },
  monochrome: {
    content: "sm:max-w-md border-2 border-rv-text bg-rv-bg",
    card: "group flex items-center gap-4 rounded-none border-l-4 border-rv-border bg-rv-surface p-4 transition-colors duration-100 hover:border-rv-text hover:bg-rv-text/5",
    cardIcon: "text-rv-text",
  },
  bauhaus: {
    content: "sm:max-w-md border-4 border-[#121212] bg-[#F0C020]",
    card: "group flex items-center gap-4 rounded-none border-2 border-[#121212] bg-white p-4 transition-all duration-150 hover:bg-[#121212] hover:text-white hover:shadow-[4px_4px_0px_0px_#121212] [&_.connect-span]:group-hover:text-[#F0C020]",
    cardIcon: "text-[#121212] group-hover:text-[#F0C020]",
  },
  linear: {
    content: "sm:max-w-md border-rv-border bg-rv-surface",
    card: "group flex items-center gap-4 rounded-lg border border-rv-border bg-rv-surface p-4 transition-all duration-300 hover:border-rv-primary hover:bg-rv-surface-hover",
    cardIcon: "text-rv-primary",
  },
} as const;

type LinkAccountDialogProps = {
  /** Single trigger element (e.g. button). Uses DialogTrigger render prop to avoid button nesting. */
  trigger: React.ReactElement;
};

export function LinkAccountDialog({ trigger }: LinkAccountDialogProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { theme } = useTheme();
  const [connectingProvider, setConnectingProvider] = useState<"gdrive" | "onedrive" | null>(null);
  const name = (theme.name ?? "vivid") as keyof typeof DIALOG_THEME;
  const styles = DIALOG_THEME[name] ?? DIALOG_THEME.vivid;

  const returnTo = typeof pathname === "string" && pathname ? encodeURIComponent(pathname) : "";
  const providers = [
    {
      id: "gdrive" as const,
      href: `/api/storage/accounts/connect?provider=gdrive${returnTo ? `&returnTo=${returnTo}` : ""}`,
      icon: Cloud,
    },
    {
      id: "onedrive" as const,
      href: `/api/storage/accounts/connect?provider=onedrive${returnTo ? `&returnTo=${returnTo}` : ""}`,
      icon: HardDrive,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent
        className={styles.content}
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold uppercase tracking-widest text-rv-text">
            {t("auth.linkStorageAccount")}
          </DialogTitle>
          <DialogDescription className="text-rv-text-muted">
            {t("auth.linkStorageDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {providers.map((provider) => {
            const isConnecting = connectingProvider === provider.id;
            return (
              <Link
                key={provider.id}
                href={provider.href}
                className={`animate-enter block ${styles.card} ${isConnecting ? "pointer-events-none opacity-70" : ""}`}
                onClick={() => setConnectingProvider(provider.id)}
                aria-busy={isConnecting}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-rv-surface-muted ${styles.cardIcon}`}
                >
                  {isConnecting ? (
                    <Loader2 className="h-6 w-6 stroke-[2px] animate-spin" />
                  ) : (
                    <provider.icon className="h-6 w-6 stroke-[2px]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-rv-text">
                    {provider.id === "gdrive" ? t("vault.googleDrive") : t("vault.oneDrive")}
                  </p>
                  <p className="text-xs text-rv-text-muted">
                    {provider.id === "gdrive" ? t("auth.gdriveDescription") : t("auth.onedriveDescription")}
                  </p>
                </div>
                <span className="connect-span text-xs font-mono uppercase tracking-wider text-rv-primary group-hover:underline">
                  {isConnecting ? t("vault.processing") : t("auth.connect")}
                </span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
