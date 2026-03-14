"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UploadCloud } from "lucide-react";

import { DashboardLayout } from "@/components/workspace/DashboardLayout";
import { FileGrid } from "@/components/workspace/FileGrid";
import { useThemeComponents } from "@/components/themes";
import type {
  AccountProvider,
  AuthSignInRequest,
  AuthUser,
  BreadcrumbItem,
  CreateFolderRequest,
  CurrentSessionResponse,
  ExplorerFile,
  ExplorerFolder,
  FilePreviewStatus,
  GetBreadcrumbResponse,
  LinkedAccount,
  ListAccountsResponse,
  ListFilesResponse,
  ListFoldersResponse,
} from "@/lib/contracts";

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type ProviderFilter = AccountProvider | "all";
type PreviewFilter = FilePreviewStatus | "all";

const DEFAULT_SIGN_IN: AuthSignInRequest = {
  email: "qa+slice2@rawvault.local",
  password: "RawVault123!",
};

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected request failure.";
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
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

export function VaultClient() {
  const { ThemeButton: Button } = useThemeComponents();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [folders, setFolders] = useState<ExplorerFolder[]>([]);
  const [files, setFiles] = useState<ExplorerFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>("all");
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);

  const refreshAllData = useCallback(async (nextFolderId: string | null = selectedFolderId) => {
    if (!user) {
      return;
    }

    setDataLoading(true);
    setDataError(null);

    try {
      const foldersQuery = new URLSearchParams();
      if (nextFolderId) {
        foldersQuery.set("parentId", nextFolderId);
      }

      const filesQuery = buildFilesQuery({
        folderId: nextFolderId,
        search,
        provider: providerFilter,
        previewStatus: previewFilter,
      });

      const [accountsResponse, foldersResponse, filesResponse, breadcrumbResponse] =
        await Promise.all([
          requestJson<ListAccountsResponse>("/api/storage/accounts"),
          requestJson<ListFoldersResponse>(
            `/api/folders${foldersQuery.toString() ? `?${foldersQuery.toString()}` : ""}`,
          ),
          requestJson<ListFilesResponse>(`/api/files?${filesQuery}`),
          nextFolderId
            ? requestJson<GetBreadcrumbResponse>(`/api/folders/${nextFolderId}/breadcrumb`)
            : Promise.resolve<GetBreadcrumbResponse>({ success: true, items: [] }),
        ]);

      setAccounts(accountsResponse.accounts);
      setFolders(foldersResponse.folders);
      setFiles(filesResponse.files);
      setBreadcrumb(breadcrumbResponse.items);
      setSelectedFolderId(nextFolderId);
    } catch (error) {
      setDataError(formatErrorMessage(error));
    } finally {
      setDataLoading(false);
    }
  }, [previewFilter, providerFilter, search, selectedFolderId, user]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const response = await requestJson<CurrentSessionResponse>("/api/auth/session");
        if (cancelled) {
          return;
        }
        setUser(response.user);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAuthError(formatErrorMessage(error));
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setFolders([]);
      setFiles([]);
      setBreadcrumb([]);
      setDataLoading(false);
      return;
    }

    void refreshAllData(selectedFolderId);
  }, [refreshAllData, selectedFolderId, user]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);

    try {
      await requestJson("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SIGN_IN),
      });

      const session = await requestJson<CurrentSessionResponse>("/api/auth/session");
      setUser(session.user);
    } catch (error) {
      setAuthError(formatErrorMessage(error));
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await requestJson("/api/auth/signout", { method: "POST" });
      setUser(null);
      setSelectedFolderId(null);
    } catch (error) {
      setAuthError(formatErrorMessage(error));
    }
  };

  const handleOpenFolder = async (folderId: string) => {
    await refreshAllData(folderId);
  };

  const handleOpenRoot = async () => {
    await refreshAllData(null);
  };

  const handleCreateFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) {
      return;
    }

    setCreatingFolder(true);
    setDataError(null);

    const payload: CreateFolderRequest = {
      name: name.trim(),
      parentId: selectedFolderId ?? undefined,
    };

    try {
      await requestJson("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refreshAllData(selectedFolderId);
    } catch (error) {
      setDataError(formatErrorMessage(error));
    } finally {
      setCreatingFolder(false);
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
      await refreshAllData(selectedFolderId);
    } catch (error) {
      setDataError(formatErrorMessage(error));
    } finally {
      setAccountActionId(null);
    }
  };

  const handleUnlinkAccount = async (accountId: string) => {
    const confirmed = window.confirm("Unlink this storage account?");
    if (!confirmed) {
      return;
    }

    setAccountActionId(accountId);
    setDataError(null);

    try {
      await requestJson("/api/storage/accounts/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, confirm: true }),
      });
      await refreshAllData(selectedFolderId);
    } catch (error) {
      setDataError(formatErrorMessage(error));
    } finally {
      setAccountActionId(null);
    }
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
        onSignOut={handleSignOut}
        onSetActiveAccount={handleSetActiveAccount}
        onUnlinkAccount={handleUnlinkAccount}
        accountActionId={accountActionId}
      >
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          Checking session...
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout
        user={null}
        accounts={[]}
        breadcrumb={[]}
        search={search}
        onSearchChange={setSearch}
        onOpenRoot={handleOpenRoot}
        onSignOut={handleSignOut}
        onSetActiveAccount={handleSetActiveAccount}
        onUnlinkAccount={handleUnlinkAccount}
        accountActionId={accountActionId}
      >
        <div className="mx-auto flex h-full max-w-xl items-center">
          <div className="w-full rounded-[var(--radius)] border border-border bg-card p-6">
            <h1 className="text-2xl font-heading font-bold uppercase tracking-widest">
              Connect Frontend To Live API
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dashboard hien tai da dung session that. Bam vao de dang nhap bang seeded QA user.
            </p>
            {authError ? (
              <p className="mt-4 rounded-[var(--radius-sm)] border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-700">
                {authError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={handleSignIn} disabled={signingIn}>
                {signingIn ? "Signing In..." : "Sign In Seeded QA"}
              </Button>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                qa+slice2@rawvault.local
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={user}
      accounts={accounts}
      breadcrumb={breadcrumb}
      search={search}
      onSearchChange={setSearch}
      onOpenRoot={handleOpenRoot}
      onSignOut={handleSignOut}
      onSetActiveAccount={handleSetActiveAccount}
      onUnlinkAccount={handleUnlinkAccount}
      accountActionId={accountActionId}
    >
      <div className="flex h-full flex-col space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="animate-enter text-3xl font-heading font-bold uppercase tracking-widest text-foreground">
              My Vault
            </h1>
            <p className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Frontend dang doc du lieu that tu auth, storage accounts, folders va files.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 font-mono uppercase tracking-wider shadow-none"
              onClick={handleCreateFolder}
              disabled={creatingFolder}
            >
              <Plus className="h-4 w-4 stroke-[1.5px]" />
              {creatingFolder ? "Creating..." : "New Folder"}
            </Button>
            <a
              href="/api/storage/accounts/connect?provider=gdrive"
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium uppercase tracking-wider text-primary-foreground"
            >
              <UploadCloud className="h-4 w-4 stroke-[1.5px]" />
              Connect GDrive
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
          {(["all", "gdrive", "onedrive"] as const).map((provider) => {
            const active = providerFilter === provider;
            const label =
              provider === "all"
                ? "All Files"
                : provider === "gdrive"
                  ? "Google Drive"
                  : "OneDrive";
            return (
              <button
                key={provider}
                type="button"
                className={`border-b-2 px-1 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-100 ${
                  active
                    ? "border-foreground font-bold text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
                onClick={() => setProviderFilter(provider)}
              >
                {label}
              </button>
            );
          })}

          {(["all", "ready", "pending", "failed"] as const).map((status) => {
            const active = previewFilter === status;
            const label =
              status === "all"
                ? "All Previews"
                : status === "ready"
                  ? "Ready Previews"
                  : status === "pending"
                    ? "Pending"
                    : "Failed";
            return (
              <button
                key={status}
                type="button"
                className={`border-b-2 px-1 py-2 text-xs font-mono uppercase tracking-widest transition-colors duration-100 ${
                  active
                    ? "border-foreground font-bold text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
                onClick={() => setPreviewFilter(status)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          <FileGrid
            folders={folders}
            files={files}
            accounts={accounts}
            breadcrumb={breadcrumb}
            loading={dataLoading}
            error={dataError}
            selectedFolderId={selectedFolderId}
            onRetry={() => refreshAllData(selectedFolderId)}
            onOpenFolder={handleOpenFolder}
            onOpenRoot={handleOpenRoot}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
