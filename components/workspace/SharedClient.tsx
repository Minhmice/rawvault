"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Copy, Check, Trash2, RefreshCcw, AlertCircle, CheckCircle2, X, FileText, Folder as FolderIcon } from "lucide-react";

import { providerConnectCallbackQueryParamKeys } from "@/lib/contracts/storage-account.contracts";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/theme/shadcn/dialog";
import { DashboardLayout } from "@/components/workspace/DashboardLayout";
import { useThemeComponents } from "@/components/themes";
import type {
  AuthUser,
  BreadcrumbItem,
  CurrentSessionResponse,
  LinkedAccount,
  ListAccountsResponse,
  ShareLink,
  ListShareLinksResponse,
} from "@/lib/contracts";
import type { UnlinkAccountResult } from "./DashboardLayout";

type ApiErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown };
};

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, credentials: "include" });
  const payload = (await response.json().catch(() => null)) as T | ApiErrorEnvelope | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

async function unlinkAccountRequest(accountId: string): Promise<UnlinkAccountResult> {
  const response = await fetch("/api/storage/accounts/unlink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, confirm: true }),
    credentials: "include",
  });
  const payload = (await response.json().catch(() => null)) as ApiErrorEnvelope | { success?: boolean } | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Request failed with status ${response.status}.`;
    const code =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.code === "string"
        ? payload.error.code
        : undefined;
    return { ok: false, error: message, code };
  }

  return { ok: true };
}

function getShareUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/s/${encodeURIComponent(token)}`;
}

function formatDate(value: string | null, neverLabel: string): string {
  if (!value) return neverLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type ConnectBanner = { type: "success"; providerLabel: string } | { type: "error"; message: string };

export function SharedClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { themeName } = useTheme();
  const { ThemeCard, ThemeButton: Button } = useThemeComponents();
  void themeName; // share card hover themed via CSS
  const shareCardHover = "rv-share-link-card-hover";

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [copyAnnouncement, setCopyAnnouncement] = useState<string>("");
  const [connectBanner, setConnectBanner] = useState<ConnectBanner | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await requestJson<CurrentSessionResponse>("/api/auth/session");
      setUser(response.user);
    } catch (error) {
      setAuthError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setAuthLoading(false);
    }
  }, [t]);

  const loadData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const [accountsResponse, linksResponse] = await Promise.all([
        requestJson<ListAccountsResponse>("/api/storage/accounts"),
        requestJson<ListShareLinksResponse>("/api/share"),
      ]);

      setAccounts(accountsResponse.accounts);
      setLinks(linksResponse.shareLinks);
    } catch (error) {
      setDataError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setDataLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    let cancelled = false;

    loadSession().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLinks([]);
      setDataLoading(false);
      return;
    }

    void loadData();
  }, [loadData, user]);

  // OAuth connect callback: read URL params, show banner, clear URL, refresh on success
  useEffect(() => {
    const provider = searchParams.get(providerConnectCallbackQueryParamKeys.provider);
    const status = searchParams.get(providerConnectCallbackQueryParamKeys.status);
    const message = searchParams.get(providerConnectCallbackQueryParamKeys.message);

    if (!provider || !status || !pathname) return;

    const providerLabel =
      provider === "gdrive" ? t("vault.googleDrive") : provider === "onedrive" ? t("vault.oneDrive") : provider;

    if (status === "success") {
      setConnectBanner({ type: "success", providerLabel });
      router.replace(pathname);
      if (user) void loadData();
    } else if (status === "error" || status === "cancelled") {
      setConnectBanner({
        type: "error",
        message: message?.trim() || t("workspace.storageConnectError"),
      });
      router.replace(pathname);
    }
  }, [pathname, searchParams, router, t, user, loadData]);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    setAuthError(null);
    try {
      await requestJson("/api/auth/signout", { method: "POST" });
      setUser(null);
    } catch (error) {
      setAuthError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleSetActiveAccount = async (accountId: string) => {
    setAccountActionId(accountId);
    setDataError(null);

    try {
      await requestJson("/api/storage/accounts/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      await loadData();
    } catch (error) {
      setDataError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setAccountActionId(null);
    }
  };

  const handleUnlinkAccount = async (accountId: string): Promise<UnlinkAccountResult> => {
    setAccountActionId(accountId);
    const result = await unlinkAccountRequest(accountId);
    if (result.ok) {
      await loadData();
    }
    setAccountActionId(null);
    return result;
  };

  const handleCopyLink = async (link: ShareLink) => {
    const url = getShareUrl(link.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setCopyAnnouncement(t("shared.linkCopied"));
      setTimeout(() => {
        setCopiedId(null);
        setCopyAnnouncement("");
      }, 2000);
    } catch {
      setDataError(t("shared.failedToCopy"));
    }
  };

  const handleRevokeClick = (linkId: string) => {
    setRevokeConfirmId(linkId);
  };

  const handleRevokeConfirm = async () => {
    const linkId = revokeConfirmId;
    if (!linkId) return;
    setRevokeConfirmId(null);
    setRevokingId(linkId);
    setDataError(null);

    try {
      await requestJson(`/api/share/${linkId}`, { method: "DELETE" });
      await loadData();
    } catch (error) {
      setDataError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setRevokingId(null);
    }
  };

  const breadcrumb: BreadcrumbItem[] = [];

  if (authLoading) {
    return (
      <DashboardLayout
        user={null}
        accounts={[]}
        breadcrumb={[]}
        search=""
        onSearchChange={() => {}}
        onOpenRoot={() => router.push("/")}
        onSignOut={handleSignOut}
        onSetActiveAccount={handleSetActiveAccount}
        onUnlinkAccount={handleUnlinkAccount}
        accountActionId={accountActionId}
        signOutLoading={signOutLoading}
      >
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          {authError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{authError}</p>
              <Button variant="outline" size="sm" onClick={() => { setAuthError(null); void loadSession(); }}>
                {t("workspace.retry")}
              </Button>
            </div>
          ) : (
            t("auth.checkingSession")
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (!user && authError) {
    return (
      <DashboardLayout
        user={null}
        accounts={[]}
        breadcrumb={[]}
        search=""
        onSearchChange={() => {}}
        onOpenRoot={() => router.push("/")}
        onSignOut={handleSignOut}
        onSetActiveAccount={() => {}}
        onUnlinkAccount={async () => ({ ok: true })}
        accountActionId={null}
        signOutLoading={signOutLoading}
      >
        <ThemeCard className="border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{authError}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setAuthError(null); void loadSession(); }}>
                {t("workspace.retry")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setAuthError(null); router.replace("/login"); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </ThemeCard>
      </DashboardLayout>
    );
  }

  if (!authLoading && !user) {
    router.replace("/login");
    return null;
  }

  const activeLinks = links; // server already excludes revoked links

  return (
    <DashboardLayout
      user={user}
      accounts={accounts}
      breadcrumb={breadcrumb}
      search=""
      onSearchChange={() => {}}
      onOpenRoot={() => router.push("/")}
      onSignOut={handleSignOut}
      onSetActiveAccount={handleSetActiveAccount}
      onUnlinkAccount={handleUnlinkAccount}
      accountActionId={accountActionId}
      signOutLoading={signOutLoading}
    >
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-6">
        {authError ? (
          <ThemeCard className="border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{authError}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAuthError(null); void handleSignOut(); }}>
                  {t("workspace.retry")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAuthError(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </ThemeCard>
        ) : null}
        {connectBanner ? (
          <ThemeCard
            className={
              connectBanner.type === "success"
                ? "border border-rv-success/40 bg-rv-success/10 p-4"
                : "border border-destructive/40 bg-destructive/10 p-4"
            }
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {connectBanner.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-rv-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
                <p className="text-sm">
                  {connectBanner.type === "success"
                    ? t("workspace.storageConnectSuccess").replace(/\{provider\}/g, connectBanner.providerLabel)
                    : connectBanner.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setConnectBanner(null)}
                aria-label={t("common.cancel")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </ThemeCard>
        ) : null}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="animate-enter text-3xl font-heading font-bold uppercase tracking-widest text-foreground">
              {t("shared.sharedByMe")}
            </h1>
            <p className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {t("shared.manageShareLinksSubtitle")}
            </p>
          </div>

          <Button variant="outline" className="gap-2" onClick={loadData} disabled={dataLoading}>
            <RefreshCcw className="h-4 w-4" />
            {t("shared.refresh")}
          </Button>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {copyAnnouncement}
        </div>

        {dataError ? (
          <ThemeCard className="border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{dataError}</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={loadData}>
                <RefreshCcw className="h-4 w-4" />
                {t("workspace.retry")}
              </Button>
            </div>
          </ThemeCard>
        ) : null}

        <section>
          <h2 id="share-links-heading" className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("shared.shareLinks")}
          </h2>

          {dataLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ThemeCard key={`skeleton-${i}`} glass className="p-4">
                  <div className="h-16 animate-pulse rounded-[var(--radius)] bg-muted" />
                </ThemeCard>
              ))}
            </div>
          ) : activeLinks.length === 0 ? (
            <ThemeCard glass className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("shared.noShareLinksYet")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/")}
              >
                {t("shared.goToMyVault")}
              </Button>
            </ThemeCard>
          ) : (
            <ul className="space-y-3 list-none p-0 m-0" aria-labelledby="share-links-heading">
              {activeLinks.map((link) => (
                <li key={link.id}>
                  <ThemeCard glass className={`flex items-center gap-4 p-4 ${shareCardHover}`}>
                    <div className="rounded-[var(--radius)] bg-primary/10 p-2 text-primary">
                      {link.resourceType === "file" ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <FolderIcon className="h-5 w-5 fill-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-semibold text-foreground">
                        {link.resourceName}
                      </h3>
                      <p className="mt-0.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        {link.resourceType === "file" ? t("shared.resourceTypeFile") : t("shared.resourceTypeFolder")} · {formatDate(link.expiresAt, t("common.never"))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        title={t("workspace.copyLink")}
                        aria-label={t("workspace.copyLink")}
                        onClick={() => handleCopyLink(link)}
                      >
                        {copiedId === link.id ? (
                          <Check className="h-4 w-4 text-rv-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title={t("shared.removeShareLinkTitle")}
                        aria-label={t("shared.removeShareLinkTitle")}
                        onClick={() => handleRevokeClick(link.id)}
                        disabled={revokingId === link.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </ThemeCard>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Dialog
          open={!!revokeConfirmId}
          onOpenChange={(open) => {
            if (!open) setRevokeConfirmId(null);
          }}
        >
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>{t("shared.removeShareLinkTitle")}</DialogTitle>
              <DialogDescription>
                {t("shared.removeShareLinkDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <Button
                variant="outline"
                onClick={() => setRevokeConfirmId(null)}
                disabled={!!revokingId}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevokeConfirm}
                disabled={!!revokingId}
              >
                {revokingId === revokeConfirmId ? t("shared.removing") : t("shared.remove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
