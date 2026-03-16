"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { providerConnectCallbackQueryParamKeys } from "@/lib/contracts/storage-account.contracts";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";
import { DashboardLayout } from "@/components/workspace/DashboardLayout";
import { VaultHeader } from "@/components/workspace/VaultHeader";
import { VaultFilterBar, type ProviderFilter } from "@/components/workspace/VaultFilterBar";
import { FileGrid } from "@/components/workspace/FileGrid";
import { ShareDialog } from "@/components/workspace/ShareDialog";
import { RenameDialog } from "@/components/workspace/RenameDialog";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import type { UnlinkAccountResult } from "@/components/workspace/DashboardLayout";
import type {
  AuthUser,
  BreadcrumbItem,
  CurrentSessionResponse,
  ExplorerFile,
  ExplorerFolder,
  FilePreviewStatus,
  GetBreadcrumbResponse,
  LinkedAccount,
  ListAccountsResponse,
  ListFilesResponse,
  ListFoldersResponse,
  UnifiedExplorerListResponse,
} from "@/lib/contracts";

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type PreviewFilter = FilePreviewStatus | "all";

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
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

function buildFilesQuery(params: {
  folderId: string | null;
  search: string;
  provider: ProviderFilter;
  previewStatus: PreviewFilter;
}) {
  const query = new URLSearchParams();

  if (params.folderId) {
    query.set("folderId", params.folderId);
  }
  if (params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.provider !== "all") {
    query.set("provider", params.provider);
  }
  if (params.previewStatus !== "all") {
    query.set("previewStatus", params.previewStatus);
  }

  query.set("sortBy", "updatedAt");
  query.set("sortOrder", "desc");

  return query.toString();
}

type ConnectBanner = { type: "success"; providerLabel: string } | { type: "error"; message: string };

export function VaultClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { ThemeCard, ThemeButton: Button } = useThemeComponents();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [folders, setFolders] = useState<ExplorerFolder[]>([]);
  const [files, setFiles] = useState<ExplorerFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  /** Unified explorer: provider-native list. When set, main view uses unified list API. */
  const [explorerContext, setExplorerContext] = useState<{
    accountId: string | null;
    providerFolderId: string | null;
    currentFolderName?: string;
  }>({ accountId: null, providerFolderId: null });
  const [unifiedFolders, setUnifiedFolders] = useState<UnifiedExplorerListResponse["folders"]>([]);
  const [unifiedFiles, setUnifiedFiles] = useState<UnifiedExplorerListResponse["files"]>([]);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{
    type: "file" | "folder";
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    type: "file" | "folder";
    id: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "file" | "folder";
    id: string;
    name: string;
  } | null>(null);
  const [connectBanner, setConnectBanner] = useState<ConnectBanner | null>(null);

  const refreshAllData = useCallback(
    async (
      nextContext?: {
        accountId: string | null;
        providerFolderId: string | null;
        currentFolderName?: string;
      },
    ) => {
      if (!user) return;

      setDataLoading(true);
      setDataError(null);

      const context = nextContext ?? explorerContext;

      try {
        const accountsResponse = await requestJson<ListAccountsResponse>("/api/storage/accounts");
        setAccounts(accountsResponse.accounts);

        if (accountsResponse.accounts.length > 0) {
          const listParams = new URLSearchParams();
          if (context.accountId) listParams.set("accountId", context.accountId);
          if (context.providerFolderId) listParams.set("providerFolderId", context.providerFolderId);
          const listResponse = await requestJson<UnifiedExplorerListResponse>(
            `/api/explorer/list${listParams.toString() ? `?${listParams.toString()}` : ""}`,
          );
          setUnifiedFolders(listResponse.folders);
          setUnifiedFiles(listResponse.files);
          setFolders([]);
          setFiles([]);
          const breadcrumbItems: BreadcrumbItem[] = [
            { name: "My Drive", accountId: null, providerFolderId: null },
          ];
          if (context.providerFolderId && context.accountId) {
            breadcrumbItems.push({
              name: context.currentFolderName ?? "Folder",
              accountId: context.accountId,
              providerFolderId: context.providerFolderId,
            });
          }
          setBreadcrumb(breadcrumbItems);
          setExplorerContext(context);
        } else {
          setUnifiedFolders([]);
          setUnifiedFiles([]);
          setFolders([]);
          setFiles([]);
          setBreadcrumb([{ name: "My Drive" }]);
        }
      } catch (error) {
        setDataError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
      } finally {
        setDataLoading(false);
      }
    },
    [explorerContext, providerFilter, search, selectedFolderId, user, t],
  );

  const loadSession = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await requestJson<CurrentSessionResponse>("/api/auth/session");
      setUser(response.user);
    } catch (error) {
      setAuthError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setAuthLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setFolders([]);
      setFiles([]);
      setUnifiedFolders([]);
      setUnifiedFiles([]);
      setBreadcrumb([]);
      setDataLoading(false);
      return;
    }

    void refreshAllData();
  }, [refreshAllData, user]);

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
      if (user) void refreshAllData();
    } else if (status === "error" || status === "cancelled") {
      setConnectBanner({
        type: "error",
        message: message?.trim() || t("workspace.storageConnectError"),
      });
      router.replace(pathname);
    }
  }, [pathname, searchParams, router, t, user, selectedFolderId, refreshAllData]);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    setAuthError(null);
    try {
      await requestJson("/api/auth/signout", { method: "POST" });
      setUser(null);
      setSelectedFolderId(null);
    } catch (error) {
      setAuthError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleOpenFolder = (folderId: string) => {
    void refreshAllData();
    setSelectedFolderId(folderId);
  };

  const handleOpenRoot = () => {
    void refreshAllData({ accountId: null, providerFolderId: null });
  };

  const handleOpenFolderUnified = (accountId: string, providerId: string, folderName: string) => {
    void refreshAllData({
      accountId,
      providerFolderId: providerId,
      currentFolderName: folderName,
    });
  };

  const handleBreadcrumbSegment = (accountId: string, providerFolderId: string) => {
    const segment = breadcrumb.find(
      (b) => b.accountId === accountId && b.providerFolderId === providerFolderId,
    );
    void refreshAllData({
      accountId,
      providerFolderId,
      currentFolderName: segment?.name ?? "Folder",
    });
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
      await refreshAllData();
    } catch (error) {
      setDataError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setAccountActionId(null);
    }
  };

  const handleShare = (target: { type: "file" | "folder"; id: string; name: string }) => {
    setShareTarget(target);
    setShareDialogOpen(true);
  };

  const handleRenameFile = (id: string, name: string) => {
    setRenameTarget({ type: "file", id, name });
  };

  const handleRenameFolder = (id: string, name: string) => {
    setRenameTarget({ type: "folder", id, name });
  };

  const handleDeleteFile = (id: string, name: string) => {
    setDeleteTarget({ type: "file", id, name });
  };

  const handleDeleteFolder = (id: string, name: string) => {
    setDeleteTarget({ type: "folder", id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const url = deleteTarget.type === "file" ? `/api/files/${deleteTarget.id}` : `/api/folders/${deleteTarget.id}`;
    await requestJson(url, { method: "DELETE" });
    await refreshAllData();
    setDeleteTarget(null);
  };

  const handleUnlinkAccount = async (accountId: string): Promise<UnlinkAccountResult> => {
    setAccountActionId(accountId);

    const result = await unlinkAccountRequest(accountId);

    if (result.ok) {
      await refreshAllData();
    }

    setAccountActionId(null);
    return result;
  };

  if (authLoading) {
    return (
      <DashboardLayout
        user={null}
        accounts={[]}
        breadcrumb={[]}
        search={search}
        onSearchChange={setSearch}
        onOpenRoot={handleOpenRoot}
        onBreadcrumbSegment={handleBreadcrumbSegment}
        onSignOut={handleSignOut}
        onSetActiveAccount={handleSetActiveAccount}
        onUnlinkAccount={handleUnlinkAccount}
        accountActionId={accountActionId}
        signOutLoading={signOutLoading}
      >
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          {t("vault.checkingSession")}
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    if (authError) {
      return (
        <DashboardLayout
          user={null}
          accounts={[]}
          breadcrumb={[]}
          search={search}
          onSearchChange={setSearch}
          onOpenRoot={handleOpenRoot}
          onBreadcrumbSegment={handleBreadcrumbSegment}
          onSignOut={handleSignOut}
          onSetActiveAccount={handleSetActiveAccount}
          onUnlinkAccount={handleUnlinkAccount}
          accountActionId={accountActionId}
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
    router.replace("/login");
    return null;
  }

  return (
    <DashboardLayout
      user={user}
      accounts={accounts}
      breadcrumb={breadcrumb}
      search={search}
      onSearchChange={setSearch}
      onOpenRoot={handleOpenRoot}
      onBreadcrumbSegment={handleBreadcrumbSegment}
      onSignOut={handleSignOut}
      onSetActiveAccount={handleSetActiveAccount}
      onUnlinkAccount={handleUnlinkAccount}
      accountActionId={accountActionId}
      signOutLoading={signOutLoading}
    >
      <div className="flex h-full min-h-0 flex-col space-y-6">
        {authError ? (
          <ThemeCard className="border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
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
                ? "border border-emerald-500/40 bg-emerald-500/10 p-4"
                : "border border-destructive/40 bg-destructive/10 p-4"
            }
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {connectBanner.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
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
        <VaultHeader
          createFolderOpen={createFolderOpen}
          onOpenChangeCreateFolder={setCreateFolderOpen}
          onRefresh={() => refreshAllData()}
          accounts={accounts}
          selectedFolderId={selectedFolderId}
          explorerContext={
            explorerContext.accountId != null
              ? {
                  accountId: explorerContext.accountId,
                  providerFolderId: explorerContext.providerFolderId,
                }
              : undefined
          }
        />

        <VaultFilterBar value={providerFilter} onChange={setProviderFilter} />

        <div className="flex-1 min-h-0">
          <FileGrid
            folders={folders}
            files={files}
            unifiedFolders={accounts.length > 0 ? unifiedFolders : undefined}
            unifiedFiles={accounts.length > 0 ? unifiedFiles : undefined}
            accounts={accounts}
            breadcrumb={breadcrumb}
            loading={dataLoading}
            error={dataError}
            selectedFolderId={selectedFolderId}
            onRetry={() => void refreshAllData()}
            onOpenFolder={handleOpenFolder}
            onOpenRoot={handleOpenRoot}
            onOpenFolderUnified={handleOpenFolderUnified}
            onOpenFileUnified={undefined}
            onShare={handleShare}
            onRenameFile={handleRenameFile}
            onRenameFolder={handleRenameFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        {/* Dialogs portal to document.body; keep state and handlers in VaultClient. */}
        {shareTarget ? (
          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={(open) => {
              setShareDialogOpen(open);
              if (!open) setShareTarget(null);
            }}
            resourceType={shareTarget.type}
            resourceId={shareTarget.id}
            resourceName={shareTarget.name}
          />
        ) : null}

        {renameTarget ? (
          <RenameDialog
            open={!!renameTarget}
            onOpenChange={(open) => {
              if (!open) setRenameTarget(null);
            }}
            type={renameTarget.type}
            id={renameTarget.id}
            currentName={renameTarget.name}
            onSuccess={() => refreshAllData()}
          />
        ) : null}

        {deleteTarget ? (
          <DeleteConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            type={deleteTarget.type}
            name={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
