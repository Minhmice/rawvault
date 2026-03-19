"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, HardDrive, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
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

type LinkAccountDialogProps = {
  /** Single trigger element (e.g. button). Uses DialogTrigger render prop to avoid button nesting. */
  trigger: React.ReactElement;
};

export function LinkAccountDialog({ trigger }: LinkAccountDialogProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { themeName } = useTheme();
  const [connectingProvider, setConnectingProvider] = useState<"gdrive" | "onedrive" | null>(null);
  void themeName; // dialog themed via CSS selectors

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
        className="rv-link-dialog-content shadow-xl"
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
                className={cn(
                  "animate-enter block group rv-link-provider-card",
                  isConnecting && "pointer-events-none opacity-70"
                )}
                onClick={() => setConnectingProvider(provider.id)}
                aria-busy={isConnecting}
              >
                <div
                  className="rv-link-provider-icon"
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
                <span className="rv-link-provider-cta connect-span group-hover:underline">
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
