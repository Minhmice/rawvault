"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Cloud, HardDrive, Users, Settings, Trash2, Clock, Star, MoreVertical, Plus, Unlink, LogOut, Loader2, Link2 } from "lucide-react";

import { LinkAccountDialog } from "@/components/auth/LinkAccountDialog";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AuthUser, LinkedAccount } from "@/lib/contracts";
import { useThemeComponents } from "../themes";

// Shadcn UI components
import { Progress } from "@/components/theme/shadcn/progress";
import { Separator } from "@/components/theme/shadcn/separator";
import { ScrollArea } from "@/components/theme/shadcn/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/theme/shadcn/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/theme/shadcn/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/theme/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/theme/shadcn/dropdown-menu";

const navItemKeys = [
  { icon: HardDrive, labelKey: "sidebar.myVault" as const, href: "/" },
  { icon: Users, labelKey: "sidebar.sharedByMe" as const, href: "/shared" },
  { icon: Clock, labelKey: "sidebar.recent" as const, href: "/recent" },
  { icon: Star, labelKey: "sidebar.starred" as const, href: "/starred" },
];

const secondaryItemKeys = [
  { icon: Trash2, labelKey: "sidebar.trash" as const, href: "/trash" },
  { icon: Settings, labelKey: "sidebar.settings" as const, href: "/settings" },
];

const NAV_THEME = {
  vivid: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
    active: "bg-rv-primary/10 text-rv-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
    inactive: "text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text hover:translate-x-1",
  },
  monochrome: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-none border-l-4 text-sm font-mono uppercase tracking-wider transition-colors duration-100",
    active: "bg-rv-text text-rv-bg border-rv-text",
    inactive: "text-rv-text-muted border-transparent hover:bg-rv-text/10 hover:text-rv-text hover:border-rv-text",
  },
  bauhaus: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-none border-2 border-transparent text-sm font-bold uppercase tracking-wider transition-all duration-150",
    active: "bg-[#121212] text-white border-[#121212]",
    inactive: "text-[#121212] hover:bg-[#F0C020] hover:border-[#121212] hover:shadow-[3px_3px_0px_0px_#121212]",
  },
  linear: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out",
    active: "bg-rv-surface-hover text-rv-text border border-rv-border",
    inactive: "text-rv-text-muted border border-transparent hover:bg-rv-surface hover:text-rv-text hover:border-rv-border",
  }
};

const LOGO_THEME = {
  vivid: {
    wrapper: "h-16 flex items-center px-6 border-b border-rv-border bg-rv-bg/50 backdrop-blur-md shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-rv-primary to-[#8b5cf6] bg-clip-text text-transparent",
  },
  monochrome: {
    wrapper: "h-16 flex items-center px-6 border-b-4 border-rv-text bg-rv-bg shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-bold text-xl tracking-[0.2em] uppercase",
  },
  bauhaus: {
    wrapper: "h-16 flex items-center px-4 border-b-4 border-[#121212] bg-[#F0C020] shrink-0",
    inner: "flex items-center gap-2 text-[#121212]",
    text: "font-heading font-black text-xl tracking-tighter uppercase",
  },
  linear: {
    wrapper: "h-16 flex items-center px-6 border-b border-rv-border shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-semibold text-lg tracking-wide",
  }
};

const ACCOUNT_CARD_THEME = {
  vivid: {
    card: "group relative rounded-xl border border-rv-border bg-rv-surface p-4 transition-all duration-300 ease-out hover:border-rv-primary/30 hover:shadow-md",
    badge: "rounded-full bg-rv-primary/10 px-2.5 py-1 text-[10px] font-bold text-rv-primary uppercase tracking-wider",
  },
  monochrome: {
    card: "group relative rounded-none border-l-4 border-rv-text bg-rv-surface p-4 transition-colors duration-100 hover:bg-rv-surface-muted",
    badge: "rounded-none border border-rv-text px-2 py-0.5 text-[10px] font-mono font-bold text-rv-text uppercase",
  },
  bauhaus: {
    card: "group relative rounded-none border-2 border-[#121212] bg-white p-4 transition-all duration-150 hover:shadow-[3px_3px_0px_0px_#121212]",
    badge: "rounded-none border-2 border-[#121212] bg-[#F0C020] px-2 py-0.5 text-[10px] font-black text-[#121212] uppercase",
  },
  linear: {
    card: "group relative rounded-lg border border-rv-border bg-rv-surface p-4 transition-all duration-300 ease-in-out hover:border-rv-border hover:bg-rv-surface-hover",
    badge: "rounded-md border border-rv-border bg-rv-surface-muted px-2 py-0.5 text-[10px] font-medium text-rv-text uppercase",
  },
};

type SidebarProps = {
  user: AuthUser | null;
  accounts: LinkedAccount[];
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  accountActionId: string | null;
  onSignOut: () => void;
  signOutLoading?: boolean;
};

function formatStorage(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function Sidebar({
  user,
  accounts,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
  onSignOut,
  signOutLoading = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLocale();
  const { ThemeButton: Button } = useThemeComponents();
  const name = (theme.name ?? "vivid") as keyof typeof NAV_THEME;
  const nav = NAV_THEME[name] ?? NAV_THEME.vivid;
  const logo = LOGO_THEME[name] ?? LOGO_THEME.vivid;
  const cardTheme = (ACCOUNT_CARD_THEME[name] ?? ACCOUNT_CARD_THEME.vivid) as (typeof ACCOUNT_CARD_THEME)["vivid"];
  const [unlinkAccountId, setUnlinkAccountId] = useState<string | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  
  const totalQuota = accounts.reduce((sum, account) => sum + account.quotaTotalBytes, 0);
  const totalUsed = accounts.reduce((sum, account) => sum + account.quotaUsedBytes, 0);
  const usage = totalQuota > 0 ? Math.min(100, Math.round((totalUsed / totalQuota) * 100)) : 0;

  return (
    <aside className="flex h-full min-h-0 w-64 flex-col border-r border-rv-border bg-rv-bg max-md:hidden">
      {/* --- LOGO SECTION --- */}
      <div className={logo.wrapper}>
        <div className={logo.inner}>
          {name === "bauhaus" ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-[#121212]">
                <span className="text-sm font-black text-[#F0C020]">RV</span>
              </div>
              <span className={logo.text}>RawVault</span>
            </div>
          ) : (
            <>
              <Cloud className={`h-5 w-5 stroke-2 ${name === "monochrome" ? "stroke-rv-text" : "text-rv-primary"}`} />
              <span className={logo.text}>RawVault</span>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        {/* --- MAIN NAVIGATION --- */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            {t("sidebar.menu")}
          </p>
          {navItemKeys.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${nav.base} ${isActive ? nav.active : nav.inactive}`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 stroke-[2px] transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {t(item.labelKey)}
              </Link>
            );
          })}

          <div className="py-2">
            <Separator className="bg-rv-border/50" />
          </div>

          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            {t("sidebar.other")}
          </p>
          {secondaryItemKeys.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${nav.base} ${isActive ? nav.active : nav.inactive}`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[2px]" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* --- LINKED ACCOUNTS SECTION --- */}
        <div className="px-4 pb-6 mt-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
              {t("sidebar.linkedAccounts")}
            </p>
            <LinkAccountDialog
              trigger={
                <button
                  type="button"
                  title={t("sidebar.linkStorageAccountAria")}
                  aria-label={t("sidebar.linkStorageAccountAria")}
                  className="rounded-full p-1 transition-colors hover:bg-rv-surface-muted text-rv-text-muted hover:text-rv-text"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
          
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rv-border p-4 text-center">
                <p className="text-sm text-rv-text-muted">{t("sidebar.noLinkedAccounts")}</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className={cardTheme.card}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-rv-text truncate">
                        {account.providerMetadata.providerLabel}
                      </p>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <p className="mt-0.5 text-xs text-rv-text-muted truncate cursor-default">
                              {account.accountEmail ?? account.providerMetadata.accountIdHint}
                            </p>
                          }
                        />
                        <TooltipContent side="right" className="max-w-[200px] break-all">
                          {account.accountEmail ?? account.providerMetadata.accountIdHint}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {account.isActive && (
                        <span className={cardTheme.badge}>{t("sidebar.active")}</span>
                      )}
                      {(account.status === "reauth_required" || account.status === "error") && (
                        <span className={cardTheme.badge}>
                          {account.status === "reauth_required" ? t("sidebar.reauthRequired") : t("sidebar.accountError")}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-rv-text-muted hover:text-rv-text hover:bg-rv-surface-muted"
                              disabled={accountActionId === account.id}
                              aria-label={t("sidebar.accountMenu")}
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="center" sideOffset={8} className="min-w-[160px]">
                          {(account.status === "reauth_required" || account.status === "error") && (
                            <DropdownMenuItem
                              onClick={() => {
                                const returnTo = pathname ? `&returnTo=${encodeURIComponent(pathname)}` : "";
                                router.push(`/api/storage/accounts/connect?provider=${encodeURIComponent(account.provider)}${returnTo}`);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Link2 className="h-4 w-4" />
                              {t("sidebar.reconnect")}
                            </DropdownMenuItem>
                          )}
                          {!account.isActive && (
                            <DropdownMenuItem
                              onClick={() => onSetActiveAccount(account.id)}
                              disabled={accountActionId === account.id}
                              className="cursor-pointer"
                            >
                              {accountActionId === account.id ? t("sidebar.saving") : t("sidebar.setActive")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setUnlinkError(null);
                              const id = account.id;
                              setTimeout(() => setUnlinkAccountId(id), 0);
                            }}
                            disabled={accountActionId === account.id}
                          >
                            <Unlink className="h-4 w-4" />
                            {t("sidebar.unlink")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-medium text-rv-text-muted">{t("sidebar.usage")}</span>
                      <span className="text-[10px] font-medium text-rv-text">
                        {formatStorage(account.quotaUsedBytes)} / {formatStorage(account.quotaTotalBytes)}
                      </span>
                    </div>
                    <Progress
                      value={account.quotaTotalBytes > 0 ? (account.quotaUsedBytes / account.quotaTotalBytes) * 100 : 0}
                      className="h-1.5 bg-rv-surface-muted"
                      style={{
                        "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)",
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <Dialog
            open={!!unlinkAccountId}
            onOpenChange={(open) => {
              if (!open) {
                setUnlinkAccountId(null);
                setUnlinkError(null);
              }
            }}
          >
            <DialogContent showCloseButton>
              <DialogHeader>
                <DialogTitle>{t("sidebar.unlinkAccountTitle")}</DialogTitle>
                <DialogDescription>
                  {unlinkAccountId ? (() => {
                    const acc = accounts.find((a) => a.id === unlinkAccountId);
                    return acc
                      ? t("sidebar.unlinkAccountDescription")
                          .replace(/\{provider\}/g, acc.providerMetadata.providerLabel)
                          .replace(/\{email\}/g, acc.accountEmail ?? acc.providerMetadata.accountIdHint ?? "")
                      : t("sidebar.unlinkAccountDescriptionFallback");
                  })() : ""}
                </DialogDescription>
              </DialogHeader>
              {unlinkError && (
                <div
                  className="rounded-lg border border-rv-danger/50 bg-rv-danger/10 px-3 py-2 text-sm text-rv-danger"
                  role="alert"
                >
                  {unlinkError}
                </div>
              )}
              <DialogFooter showCloseButton={false}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUnlinkAccountId(null);
                    setUnlinkError(null);
                  }}
                  disabled={unlinkLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="default"
                  className="bg-rv-danger hover:bg-rv-danger/90"
                  disabled={unlinkLoading}
                  onClick={async () => {
                    if (!unlinkAccountId) return;
                    setUnlinkLoading(true);
                    setUnlinkError(null);
                    try {
                      const result = await onUnlinkAccount(unlinkAccountId);
                      if (result.ok) {
                        setUnlinkAccountId(null);
                        setUnlinkError(null);
                      } else {
                        setUnlinkError(result.error ?? t("common.failedToUnlink"));
                      }
                    } catch {
                      setUnlinkError(t("common.unexpectedError"));
                    } finally {
                      setUnlinkLoading(false);
                    }
                  }}
                >
                  {unlinkLoading ? t("common.unlinking") : t("common.unlink")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ScrollArea>

      {/* --- SESSION WIDGET AND GLOBAL QUOTA --- */}
      <div className="mt-auto shrink-0 border-t border-rv-border bg-rv-surface p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border border-rv-border/50">
            <AvatarImage src={`https://avatar.vercel.sh/${user?.email ?? "anon"}.png`} />
            <AvatarFallback className="bg-rv-primary/10 text-rv-primary font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-rv-text truncate">
              {user?.email ?? t("sidebar.signedOut")}
            </p>
            <p className="text-[10px] text-rv-text-muted uppercase tracking-wider">
              {name === "bauhaus" ? t("sidebar.userSession") : t("sidebar.personal")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-rv-text-muted hover:text-rv-text hover:bg-rv-surface-muted"
                  aria-label={t("sidebar.accountMenu")}
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={8} className="min-w-[160px]">
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {t("common.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={onSignOut}
                disabled={signOutLoading}
                className="flex items-center gap-2 cursor-pointer"
              >
                {signOutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {t("sidebar.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-rv-text-muted">{t("sidebar.totalQuota")}</span>
            <span className="font-semibold text-rv-text">{usage}%</span>
          </div>
          <Progress 
            value={usage} 
            className="h-2 bg-rv-border"
            style={{ 
              "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)"
            } as React.CSSProperties}
          />
          <p className="text-[10px] text-rv-text-muted mt-1 text-right">
            {formatStorage(totalUsed)} of {formatStorage(totalQuota)}
          </p>
        </div>
      </div>
    </aside>
  );
}
