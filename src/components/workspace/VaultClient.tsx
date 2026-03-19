"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { providerConnectCallbackQueryParamKeys } from "@/lib/contracts/storage-account.contracts";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useLoadingOverlay } from "@/components/ui/LoadingOverlayContext";
import { useThemeComponents } from "@/components/themes";
import { DashboardLayout } from "@/components/workspace/DashboardLayout";
import { VaultHeader } from "@/components/workspace/VaultHeader";
import { FileGrid } from "@/components/workspace/FileGrid";
import { ShareDialog } from "@/components/workspace/ShareDialog";
import { RenameDialog } from "@/components/workspace/RenameDialog";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import { Separator } from "@/components/theme/shadcn/separator";
import { PreviewOverlay } from "@/components/preview/PreviewOverlay";
import { PreviewRouter } from "@/components/preview/PreviewRouter";
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
import type { UnifiedExplorerItem } from "@/lib/contracts/explorer-list.contracts";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { buildPreviewModel, buildPreviewModelFromUnified } from "@/lib/preview/build-preview-model";
import { classifyFileKind } from "@/lib/preview/file-type-resolver";

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type PreviewFilter = FilePreviewStatus | "all";

const THUMB_REQUIRED_IMAGE_EXTENSIONS = new Set(["psd", "psb", "ai", "eps", "tga", "jxl"]);

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

function classifyUnifiedFileKind(file: UnifiedExplorerItem) {
  const baseKind = classifyFileKind(file.mimeType, file.name);
  if (baseKind !== "image") return baseKind;
  const ext = getExtension(file.name);
  if (THUMB_REQUIRED_IMAGE_EXTENSIONS.has(ext) && !file.thumbnailUrl) return "unsupported";
  return baseKind;
}

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
  previewStatus: PreviewFilter;
}) {
  const query = new URLSearchParams();

  if (params.folderId) {
    query.set("folderId", params.folderId);
  }
  if (params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.previewStatus !== "all") {
    query.set("previewStatus", params.previewStatus);
  }

  query.set("sortBy", "updatedAt");
  query.set("sortOrder", "desc");

  return query.toString();
}

type ConnectBanner = { type: "success"; providerLabel: string } | { type: "error"; message: string };

function EnterSection(props: {
  entered: boolean;
  delayMs: number;
  children: React.ReactNode;
  className?: string;
}) {
  const style = useMemo<React.CSSProperties | undefined>(() => {
    if (!props.entered) return undefined;
    return { animationDelay: `${props.delayMs}ms` };
  }, [props.delayMs, props.entered]);

  return (
    <div className={`${props.entered ? "animate-enter" : "opacity-0"} ${props.className ?? ""}`} style={style}>
      {props.children}
    </div>
  );
}

export function VaultClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { filesLoading, setFilesLoading } = useLoadingOverlay();
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
  const [previewModels, setPreviewModels] = useState<PreviewModel[]>([]);
  const [previewIdx, setPreviewIdx] = useState(-1);
  const previewModel = previewIdx >= 0 ? previewModels[previewIdx] ?? null : null;
  const [connectBanner, setConnectBanner] = useState<ConnectBanner | null>(null);
  const [contentEntered, setContentEntered] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (contentEntered) return;
    if (filesLoading) return;
    // Delay enter until the global LoadingScreen finishes its dwell+fade,
    // otherwise the animation happens behind the overlay and is invisible.
    const timer = window.setTimeout(() => setContentEntered(true), 750);
    return () => window.clearTimeout(timer);
  }, [contentEntered, filesLoading, user]);

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
    [explorerContext, search, selectedFolderId, user, t],
  );

  const loadSession = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    let gotUser = false;
    try {
      const response = await requestJson<CurrentSessionResponse>("/api/auth/session");
      setUser(response.user);
      gotUser = !!response.user;
    } catch (error) {
      setAuthError(formatErrorMessage(error, t("common.unexpectedRequestFailure")));
    } finally {
      setAuthLoading(false);
      if (!gotUser) setFilesLoading(false);
    }
  }, [t, setFilesLoading]);

  useEffect(() => {
    setFilesLoading(true);
    void loadSession();
  }, [loadSession, setFilesLoading]);

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

    refreshAllData().finally(() => setFilesLoading(false));
  }, [refreshAllData, user, setFilesLoading]);

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

  const handlePreview = useCallback((file: ExplorerFile) => {
    const clickedKind = classifyFileKind(file.mime, file.name);
    if (clickedKind === "unsupported" || clickedKind === "google_redirect") return;

    const navigable = files.filter((f) => {
      const kind = classifyFileKind(f.mime, f.name);
      return kind !== "google_redirect" && kind !== "unsupported";
    });
    const models = navigable.map((f) => buildPreviewModel(f));
    const idx = navigable.findIndex((f) => f.id === file.id);
    if (idx === -1) return;
    setPreviewModels(models);
    setPreviewIdx(idx);
  }, [files]);

  const handlePreviewUnified = useCallback(
    (file: UnifiedExplorerItem) => {
      const clickedKind = classifyUnifiedFileKind(file);
      if (clickedKind === "unsupported" || clickedKind === "google_redirect") return;

      const navigable = unifiedFiles.filter((f) => {
        const kind = classifyUnifiedFileKind(f);
        return kind !== "google_redirect" && kind !== "unsupported";
      });
      const models = navigable.map((f) => {
        const acct = accounts.find((a) => a.id === f.accountId);
        const provider = acct?.provider === "gdrive" || acct?.provider === "onedrive" ? acct.provider : undefined;
        return buildPreviewModelFromUnified(f, provider);
      });
      const idx = navigable.findIndex((f) => f.accountId === file.accountId && f.providerId === file.providerId);
      if (idx === -1) return;
      setPreviewModels(models);
      setPreviewIdx(idx);
    },
    [unifiedFiles, accounts],
  );

  const handleClosePreview = useCallback(() => {
    setPreviewIdx(-1);
    setPreviewModels([]);
  }, []);
  const handlePrevPreview = useCallback(() => setPreviewIdx((i) => Math.max(0, i - 1)), []);
  const handleNextPreview = useCallback(() => setPreviewIdx((i) => Math.min(previewModels.length - 1, i + 1)), [previewModels.length]);

  const previewDownload = previewModel?.source.downloadUrl;

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
        <div className="min-h-0 w-full min-w-0 flex-1" aria-busy="true" aria-label={t("workspace.loading")} />
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
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-6">
        {authError ? (
          <EnterSection entered={contentEntered} delayMs={0}>
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
          </EnterSection>
        ) : null}
        {connectBanner ? (
          <EnterSection entered={contentEntered} delayMs={40}>
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
          </EnterSection>
        ) : null}

        <EnterSection entered={contentEntered} delayMs={80}>
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
        </EnterSection>

        <EnterSection entered={contentEntered} delayMs={140}>
          <Separator className="bg-border/60" />
        </EnterSection>

        <EnterSection entered={contentEntered} delayMs={200} className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <FileGrid
            folders={folders}
            files={files}
            unifiedFolders={accounts.length > 0 ? unifiedFolders : undefined}
            unifiedFiles={accounts.length > 0 ? unifiedFiles : undefined}
            accounts={accounts}
            breadcrumb={breadcrumb}
            loading={dataLoading}
            entered={contentEntered}
            error={dataError}
            selectedFolderId={selectedFolderId}
            onRetry={() => void refreshAllData()}
            onOpenFolder={handleOpenFolder}
            onOpenRoot={handleOpenRoot}
            onOpenFolderUnified={handleOpenFolderUnified}
            onOpenFileUnified={undefined}
            onPreview={handlePreview}
            onPreviewUnified={handlePreviewUnified}
            onShare={handleShare}
            onRenameFile={handleRenameFile}
            onRenameFolder={handleRenameFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
          />
        </EnterSection>

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

        <PreviewOverlay
          open={previewModel !== null}
          onClose={handleClosePreview}
          model={previewModel}
          onDownload={
            previewDownload
              ? () => { window.location.href = previewDownload; }
              : undefined
          }
          onPrev={handlePrevPreview}
          onNext={handleNextPreview}
          hasPrev={previewIdx > 0}
          hasNext={previewIdx < previewModels.length - 1}
        >
          {previewModel && (
            <PreviewRouter
              model={previewModel}
              onDownload={
                previewDownload
                  ? () => { window.location.href = previewDownload; }
                  : undefined
              }
            />
          )}
        </PreviewOverlay>
      </div>
    </DashboardLayout>
  );
}
