"use client";

import {
  MoreVertical,
  Image as ImageIcon,
  FileText,
  Video,
  Folder as FolderIcon,
  Share2,
  Download,
  RefreshCcw,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/theme/shadcn/dropdown-menu";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { useThemeComponents } from "../themes";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import type { BreadcrumbItem, ExplorerFile, ExplorerFolder, LinkedAccount, UnifiedExplorerItem } from "@/lib/contracts";

/** App file with optional list response fields for split/download-only (backend may add later). */
type ExplorerFileWithViewerFlags = ExplorerFile & {
  is_split?: boolean;
  viewer_mode?: string;
};

type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";

const FOLDER_CARD_HOVER: Record<ThemeName, string> = {
  vivid:
    "hover:-translate-y-1 hover:shadow-lg [transition:transform_350ms_cubic-bezier(0.34,1.56,0.64,1),box-shadow_350ms_ease-out]",
  monochrome:
    "hover:bg-foreground hover:text-background [transition:background-color_60ms_steps(1),color_60ms_steps(1)]",
  bauhaus:
    "hover:-translate-y-[3px] hover:shadow-[4px_8px_0px_0px_#121212] active:translate-y-[2px] active:shadow-none [transition:transform_150ms_ease-out,box-shadow_150ms_ease-out]",
  linear:
    "[transition:transform_250ms_cubic-bezier(0.16,1,0.3,1),box-shadow_250ms_cubic-bezier(0.16,1,0.3,1),border-color_250ms_ease] hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_40px_rgba(94,106,210,0.08),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
};

type ShareTarget =
  | { type: "file"; id: string; name: string }
  | { type: "folder"; id: string; name: string };

type FileGridProps = {
  folders: ExplorerFolder[];
  files: ExplorerFile[];
  /** Unified (provider-native) list; when set, these are shown instead of folders/files. */
  unifiedFolders?: UnifiedExplorerItem[];
  unifiedFiles?: UnifiedExplorerItem[];
  accounts: LinkedAccount[];
  breadcrumb: BreadcrumbItem[];
  loading: boolean;
  error: string | null;
  selectedFolderId: string | null;
  onRetry: () => void;
  onOpenFolder: (folderId: string) => void;
  onOpenRoot: () => void;
  /** When using unified list: open folder by provider context. */
  onOpenFolderUnified?: (accountId: string, providerId: string, folderName: string) => void;
  /** When using unified list: open file (stream) by provider context. */
  onOpenFileUnified?: (accountId: string, providerId: string, name: string) => void;
  onShare?: (target: ShareTarget) => void;
  onRenameFile?: (id: string, name: string) => void;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFile?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string, name: string) => void;
  onPreview?: (file: ExplorerFile) => void;
};

function formatBytes(bytes: number) {
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const PREVIEW_TONE: Record<ThemeName, Record<ExplorerFile["previewStatus"] | "default", string>> = {
  vivid: { ready: "text-emerald-600", failed: "text-red-600", pending: "text-amber-600", processing: "text-amber-600", default: "text-muted-foreground" },
  monochrome: { ready: "text-foreground font-bold", failed: "text-foreground underline", pending: "text-muted-foreground", processing: "text-muted-foreground", default: "text-muted-foreground" },
  bauhaus: { ready: "text-[#1040C0]", failed: "text-[#D02020]", pending: "text-[#F0C020]", processing: "text-[#F0C020]", default: "text-muted-foreground" },
  linear: { ready: "text-emerald-400", failed: "text-red-400", pending: "text-amber-400", processing: "text-amber-400", default: "text-muted-foreground" },
};

function previewTone(status: ExplorerFile["previewStatus"], themeName: ThemeName) {
  const tones = PREVIEW_TONE[themeName] ?? PREVIEW_TONE.vivid;
  return tones[status ?? "default"] ?? tones.default;
}

function fileTypeFromRecord(file: ExplorerFile) {
  if (file.mime?.startsWith("image/")) return "image";
  if (file.mime?.startsWith("video/")) return "video";
  if (file.ext?.toLowerCase() === "arw") return "raw";
  return "doc";
}

type FileTypeKey = "workspace.fileTypeImg" | "workspace.fileTypeVideo" | "workspace.fileTypePdf" | "workspace.fileTypeDoc";
function fileTypeLabel(file: ExplorerFile): FileTypeKey {
  const t = fileTypeFromRecord(file);
  if (t === "image" || t === "raw") return "workspace.fileTypeImg";
  if (t === "video") return "workspace.fileTypeVideo";
  const ext = file.ext?.toUpperCase() ?? file.name.split(".").pop()?.toUpperCase();
  if (ext === "PDF") return "workspace.fileTypePdf";
  return "workspace.fileTypeDoc";
}

export function FileGrid({
  folders,
  files,
  unifiedFolders,
  unifiedFiles,
  accounts,
  breadcrumb,
  loading,
  error,
  selectedFolderId,
  onRetry,
  onOpenFolder,
  onOpenRoot,
  onOpenFolderUnified,
  onOpenFileUnified,
  onShare,
  onRenameFile,
  onRenameFolder,
  onDeleteFile,
  onDeleteFolder,
  onPreview,
}: FileGridProps) {
  const { t } = useLocale();
  const { ThemeCard, ThemeButton: Button } = useThemeComponents();
  const { theme } = useTheme();
  const name = (theme.name ?? "vivid") as ThemeName;
  const getPreviewTone = (s: ExplorerFile["previewStatus"]) => previewTone(s, name);

  const folderHoverClass = FOLDER_CARD_HOVER[name];
  const useUnified = unifiedFolders !== undefined;
  const displayFolders = useUnified ? (unifiedFolders ?? []) : folders;
  const displayFiles = useUnified ? (unifiedFiles ?? []) : files;
  const isEmpty = !loading && !error && displayFolders.length === 0 && displayFiles.length === 0;

  const getAccountProvider = (accountId: string) =>
    accounts.find((a) => a.id === accountId)?.provider ?? "gdrive";

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
      case "raw":
        return <ImageIcon className="h-10 w-10 text-blue-500" />;
      case "video":
        return <Video className="h-10 w-10 text-purple-500" />;
      case "doc":
        return <FileText className="h-10 w-10 text-red-500" />;
      default:
        return <FileText className="h-10 w-10 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in" aria-busy="true" aria-live="polite">
        <div className="rounded-lg border border-border bg-muted/20 p-8 text-center" role="status">
          <RefreshCcw className="mx-auto h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
          <p className="mt-4 text-sm font-medium text-foreground">{t("workspace.loading")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("workspace.loadingHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {error ? (
        <ThemeCard className="border border-destructive/40 bg-destructive/10 p-4" role="alert">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4" />
              {t("workspace.retry")}
            </Button>
          </div>
        </ThemeCard>
      ) : null}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("workspace.folders")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useUnified
            ? (displayFolders as UnifiedExplorerItem[]).map((folder) => (
                <ThemeCard
                  key={`${folder.accountId}:${folder.providerId}`}
                  glass
                  className={`group flex cursor-pointer flex-col overflow-hidden ${folderHoverClass}`}
                  onClick={() => onOpenFolderUnified?.(folder.accountId, folder.providerId, folder.name)}
                >
                  <div className="flex min-h-0 flex-1 flex-col p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
                        <FolderIcon className="h-4 w-4 fill-current" />
                      </span>
                      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={folder.name}>
                        {folder.name}
                      </h3>
                    </div>
                    <p className="mt-1 truncate pl-10 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {getAccountProvider(folder.accountId) === "gdrive" ? t("vault.googleDrive") : t("vault.oneDrive")}
                    </p>
                  </div>
                </ThemeCard>
              ))
            : (displayFolders as ExplorerFolder[]).map((folder) => (
                <ThemeCard
                  key={folder.id}
                  glass
                  className={`group flex cursor-pointer flex-col overflow-hidden ${folderHoverClass}`}
                  onClick={() => onOpenFolder(folder.id)}
                >
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
                    <FolderIcon className="h-4 w-4 fill-current" />
                  </span>
                  <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={folder.name}>
                    {folder.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      nativeButton={false}
                      render={(props) => {
                        const { asChild, ...rest } = props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void };
                        return (
                          <span
                            role="button"
                            tabIndex={0}
                            {...rest}
                            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            aria-label={t("workspace.folderMenuAria")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e as unknown as React.MouseEvent);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </span>
                        );
                      }}
                    />
                    <DropdownMenuContent align="end" className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                      {onShare ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onShare({ type: "folder", id: folder.id, name: folder.name });
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          {t("workspace.share")}
                        </DropdownMenuItem>
                      ) : null}
                      {onRenameFolder ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onRenameFolder(folder.id, folder.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          {t("workspace.rename")}
                        </DropdownMenuItem>
                      ) : null}
                      {onDeleteFolder ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            onDeleteFolder(folder.id, folder.name);
                          }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("workspace.delete")}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-1 truncate pl-10 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {folder.path} · {formatDate(folder.updatedAt)}
                </p>
              </div>
            </ThemeCard>
              ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("workspace.recentFiles")}
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            {displayFiles.length} {t("workspace.filesCount")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {useUnified
            ? (displayFiles as UnifiedExplorerItem[]).map((file) => {
                const typeLabel = file.mimeType?.startsWith("image/")
                  ? t("workspace.fileTypeImg")
                  : file.mimeType?.startsWith("video/")
                    ? t("workspace.fileTypeVideo")
                    : file.name.toLowerCase().endsWith(".pdf")
                      ? t("workspace.fileTypePdf")
                      : t("workspace.fileTypeDoc");
                const streamUrl = `/api/explorer/stream?accountId=${encodeURIComponent(file.accountId)}&providerFileId=${encodeURIComponent(file.providerId)}&name=${encodeURIComponent(file.name)}`;
                const downloadUrl = `${streamUrl}&download=1`;
                return (
                  <ThemeCard
                    key={`${file.accountId}:${file.providerId}`}
                    glass
                    className={`group flex cursor-pointer flex-col overflow-hidden ${folderHoverClass}`}
                    onClick={() => {
                      if (onOpenFileUnified) onOpenFileUnified(file.accountId, file.providerId, file.name);
                      else window.open(streamUrl, "_blank");
                    }}
                  >
                    <div className="flex min-h-0 flex-1 flex-col p-2">
                      <div className="flex items-center gap-2 border-b border-border bg-card p-2">
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {typeLabel}
                        </span>
                        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={file.name}>
                          {file.name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            nativeButton={false}
                            render={(props) => {
                              const { asChild, ...rest } = props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void };
                              return (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  {...rest}
                                  className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                                  aria-label={t("workspace.fileMenuAria")}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e as unknown as React.MouseEvent);
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
                                  }}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </span>
                              );
                            }}
                          />
                          <DropdownMenuContent align="end" className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                window.open(streamUrl, "_blank");
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              {t("workspace.open")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                const a = document.createElement("a");
                                a.href = downloadUrl;
                                a.download = file.name;
                                a.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                              {t("workspace.download")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex h-36 flex-col items-center justify-center bg-muted/50">
                        {getIcon(file.mimeType?.startsWith("image/") ? "image" : file.mimeType?.startsWith("video/") ? "video" : "doc")}
                        <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {formatBytes(file.sizeBytes ?? 0)}
                        </div>
                        <span className="mt-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-sans normal-case">
                          {getAccountProvider(file.accountId) === "gdrive" ? t("vault.googleDrive") : t("vault.oneDrive")}
                        </span>
                      </div>
                    </div>
                  </ThemeCard>
                );
              })
            : (displayFiles as ExplorerFile[]).map((file) => {
            const fileWithFlags = file as ExplorerFileWithViewerFlags;
            const isSplit = fileWithFlags.is_split === true;
            const isDownloadOnly = fileWithFlags.viewer_mode === "download_only";
            const downloadOnlyClick = isSplit || isDownloadOnly;
            const typeKey = fileTypeLabel(file);
            const typeLabel = t(typeKey);
            return (
            <ThemeCard
              key={file.id}
              glass
              className={`group flex cursor-pointer flex-col overflow-hidden ${folderHoverClass}`}
               onClick={() => {
                 if (downloadOnlyClick) {
                   const a = document.createElement("a");
                   a.href = `/api/files/${file.id}/download`;
                   a.download = file.name;
                   a.click();
                 } else {
                   onPreview?.(file);
                 }
               }}
             >
              {/* Header: type badge + filename + optional split/download-only badge + three-dots */}
              <div className="flex items-center gap-2 border-b border-border bg-card p-2">
                <span
                  className={cn(
                    "flex h-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-[10px] font-bold uppercase tracking-wider text-white",
                    typeKey === "workspace.fileTypePdf"
                      ? "bg-red-500/90"
                      : typeKey === "workspace.fileTypeImg"
                        ? "bg-blue-500/90"
                        : typeKey === "workspace.fileTypeVideo"
                          ? "bg-purple-500/90"
                          : "bg-muted-foreground/90"
                  )}
                >
                  {typeLabel}
                </span>
                <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={file.name}>
                  {file.name}
                </h3>
                {(isSplit || isDownloadOnly) && (
                  <span
                    className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    title={isSplit ? t("workspace.fileBadgeSplit") : t("workspace.fileBadgeDownloadOnly")}
                  >
                    {isSplit ? t("workspace.fileBadgeSplit") : t("workspace.fileBadgeDownloadOnly")}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    nativeButton={false}
                    render={(props) => {
                      const { asChild, ...rest } = props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void };
                      return (
                        <span
                          role="button"
                          tabIndex={0}
                          {...rest}
                          className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                          aria-label={t("workspace.fileMenuAria")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e as unknown as React.MouseEvent);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            (rest as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </span>
                      );
                    }}
                  />
                  <DropdownMenuContent align="end" className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                    {onShare ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onShare({ type: "file", id: file.id, name: file.name });
                        }}
                        >
                          <Share2 className="h-4 w-4" />
                          {t("workspace.share")}
                        </DropdownMenuItem>
                    ) : null}
                    {onRenameFile ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onRenameFile(file.id, file.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        {t("workspace.rename")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        const a = document.createElement("a");
                        a.href = `/api/files/${file.id}/download`;
                        a.download = file.name;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                      {t("workspace.download")}
                    </DropdownMenuItem>
                    {onDeleteFile ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                            onSelect={(e) => {
                            e.preventDefault();
                            onDeleteFile(file.id, file.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("workspace.delete")}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Preview area */}
              <div className="flex h-36 flex-col items-center justify-center bg-muted/50">
                {getIcon(fileTypeFromRecord(file))}
                <div className="mt-2 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span>{formatBytes(file.sizeBytes)}</span>
                  <span>{formatDate(file.updatedAt)}</span>
                  <span
                    className="rounded bg-muted px-1.5 py-0.5 font-sans normal-case tracking-normal"
                    title={file.provider === "gdrive" ? t("vault.googleDrive") : file.provider === "onedrive" ? t("vault.oneDrive") : file.provider}
                  >
                    {file.provider === "gdrive"
                      ? t("vault.googleDrive")
                      : file.provider === "onedrive"
                        ? t("vault.oneDrive")
                        : file.provider}
                  </span>
                </div>
                <span className={cn("mt-1 text-[10px] font-mono uppercase tracking-wider", getPreviewTone(file.previewStatus))}>
                  {file.previewStatus === "ready"
                    ? t("vault.readyPreviews")
                    : file.previewStatus === "pending"
                      ? t("vault.pending")
                      : file.previewStatus === "processing"
                        ? t("vault.processing")
                        : file.previewStatus === "failed"
                          ? t("vault.failed")
                          : file.previewStatus ?? ""}
                </span>
              </div>
            </ThemeCard>
          );
          })}
        </div>

        {isEmpty ? (
          <ThemeCard glass className="mt-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("workspace.noFoldersOrFiles")}
            </p>
          </ThemeCard>
        ) : null}
      </section>
    </div>
  );
}
