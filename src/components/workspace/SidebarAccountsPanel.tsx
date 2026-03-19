"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MoreVertical, Plus, Unlink, LogOut, Loader2, Link2, Settings } from "lucide-react";

import { LinkAccountDialog } from "@/components/auth/LinkAccountDialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AuthUser, LinkedAccount } from "@/lib/contracts";
import { AppButton } from "@/components/app/AppButton";
import { AppIconButton } from "@/components/app/AppIconButton";
import { Progress } from "@/components/theme/shadcn/progress";
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

export type SidebarAccountsPanelProps = {
  user: AuthUser | null;
  accounts: LinkedAccount[];
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  accountActionId: string | null;
  onSignOut: () => void;
  signOutLoading?: boolean;
};

/** Linked accounts + unlink dialog — lives inside sidebar scroll on desktop */
export function SidebarLinkedAccountsSection({
  user,
  accounts,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
  onSignOut,
  signOutLoading = false,
}: SidebarAccountsPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { themeName } = useTheme();
  const { t } = useLocale();
  const name = themeName;
  const [unlinkAccountId, setUnlinkAccountId] = useState<string | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  return (
    <>
      <div className="px-4 pb-6 mt-2 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            {t("sidebar.linkedAccounts")}
          </p>
          <LinkAccountDialog
            trigger={
              <AppIconButton
                variant="ghost"
                title={t("sidebar.linkStorageAccountAria")}
                aria-label={t("sidebar.linkStorageAccountAria")}
                className="h-7 w-7 rounded-full p-1 transition-colors text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text"
              >
                <Plus className="h-3.5 w-3.5" />
              </AppIconButton>
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
              <div key={account.id} className={cn("group rv-account-card min-w-0")}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <AppIconButton
                        variant="ghost"
                        className="absolute top-3 right-3 z-10 h-8 w-8 shrink-0 rounded-md text-rv-text-muted hover:text-rv-text hover:bg-rv-surface-muted"
                        disabled={accountActionId === account.id}
                        aria-label={t("sidebar.accountMenu")}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </AppIconButton>
                    }
                  />
                  <DropdownMenuContent side="right" align="end" sideOffset={8} className="min-w-[160px]">
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
                        setTimeout(() => setUnlinkAccountId(account.id), 0);
                      }}
                      disabled={accountActionId === account.id}
                    >
                      <Unlink className="h-4 w-4" />
                      {t("sidebar.unlink")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="min-w-0 pr-10">
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {account.isActive && <span className="rv-account-badge">{t("sidebar.active")}</span>}
                    {(account.status === "reauth_required" || account.status === "error") && (
                      <span className="rv-account-badge">
                        {account.status === "reauth_required" ? t("sidebar.reauthRequired") : t("sidebar.accountError")}
                      </span>
                    )}
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
                    style={
                      {
                        "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)",
                      } as React.CSSProperties
                    }
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
                {unlinkAccountId
                  ? (() => {
                      const acc = accounts.find((a) => a.id === unlinkAccountId);
                      return acc
                        ? t("sidebar.unlinkAccountDescription")
                            .replace(/\{provider\}/g, acc.providerMetadata.providerLabel)
                            .replace(/\{email\}/g, acc.accountEmail ?? acc.providerMetadata.accountIdHint ?? "")
                        : t("sidebar.unlinkAccountDescriptionFallback");
                    })()
                  : ""}
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
              <AppButton
                variant="outline"
                onClick={() => {
                  setUnlinkAccountId(null);
                  setUnlinkError(null);
                }}
                disabled={unlinkLoading}
              >
                {t("common.cancel")}
              </AppButton>
              <AppButton
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
              </AppButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

/** Session + quota — fixed below scroll on desktop sidebar */
export function SidebarSessionFooter({
  user,
  accounts,
  onSignOut,
  signOutLoading = false,
}: Pick<SidebarAccountsPanelProps, "user" | "accounts" | "onSignOut" | "signOutLoading">) {
  const router = useRouter();
  const { themeName } = useTheme();
  const { t } = useLocale();
  const name = themeName;
  const email = user?.email ?? null;
  const username = email ? email.split("@")[0] || null : null;

  const totalQuota = accounts.reduce((sum, account) => sum + account.quotaTotalBytes, 0);
  const totalUsed = accounts.reduce((sum, account) => sum + account.quotaUsedBytes, 0);
  const usage = totalQuota > 0 ? Math.min(100, Math.round((totalUsed / totalQuota) * 100)) : 0;

  return (
    <footer className="mt-auto min-w-0 shrink-0 border-t border-rv-border bg-rv-surface px-4 py-3">
      {/* User identity block */}
      <section
        className="relative min-w-0"
        aria-label={name === "bauhaus" ? t("sidebar.userSession") : t("sidebar.personal")}
      >
        <div className="flex items-center gap-3 pr-9">
          <Avatar className="h-8 w-8 shrink-0 border border-rv-border/50 rounded-full overflow-hidden">
            <AvatarImage src={`https://avatar.vercel.sh/${email ?? "anon"}.png`} alt="" />
            <AvatarFallback className="bg-rv-primary/10 text-rv-primary text-xs font-bold">
              {username?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-xs font-semibold text-rv-text truncate" title={username ?? undefined}>
              {username ?? t("sidebar.signedOut")}
            </p>
            <p className="text-[10px] text-rv-text-muted mt-0.5 truncate" title={email ?? undefined}>
              {email ?? (name === "bauhaus" ? t("sidebar.userSession") : t("sidebar.personal"))}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-0 z-10 -translate-y-1/2 h-7 w-7 shrink-0 rounded-md text-rv-text-muted hover:text-rv-text hover:bg-rv-surface-muted transition-none! transform-none! hover:transform-none! active:transform-none!"
                aria-label={t("sidebar.accountMenu")}
              >
                <MoreVertical className="h-4 w-4" />
              </AppButton>
            }
          />
          <DropdownMenuContent side="top" align="end" sideOffset={8} className="min-w-[160px]">
            <DropdownMenuItem onClick={() => router.push("/settings")} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("common.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={onSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-2 cursor-pointer"
            >
              {signOutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {t("sidebar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Quota block — clear visual separation */}
      <section
        className="mt-3 pt-3 border-t border-rv-border min-w-0"
        aria-label={t("sidebar.totalQuota")}
      >
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-rv-text-muted shrink-0">
            {t("sidebar.totalQuota")}
          </span>
          <span className="text-xs font-semibold text-rv-text tabular-nums shrink-0" aria-hidden="true">
            {usage}%
          </span>
        </div>
        <Progress
          value={usage}
          className="h-1.5 bg-rv-surface-muted"
          style={
            {
              "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)",
            } as React.CSSProperties
          }
          aria-valuenow={usage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <p className="text-[10px] text-rv-text-muted mt-1.5 truncate text-right" aria-hidden="true">
          {formatStorage(totalUsed)} of {formatStorage(totalQuota)}
        </p>
      </section>
    </footer>
  );
}

/** Full accounts + session for mobile drawer (single scroll) */
export function SidebarMobileSheetBody(props: SidebarAccountsPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <SidebarLinkedAccountsSection {...props} />
      <SidebarSessionFooter
        user={props.user}
        accounts={props.accounts}
        onSignOut={props.onSignOut}
        signOutLoading={props.signOutLoading}
      />
    </div>
  );
}
