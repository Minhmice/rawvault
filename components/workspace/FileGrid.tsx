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
} from "lucide-react";

import { useThemeComponents } from "../themes";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import type { BreadcrumbItem, ExplorerFile, ExplorerFolder, LinkedAccount } from "@/lib/contracts";

type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";

const FILE_HOVER_OVERLAY: Record<ThemeName, string> = {
  vivid:
    "absolute inset-0 opacity-0 group-hover:opacity-100 [transition:opacity_300ms_ease] bg-background/80 backdrop-blur-sm flex items-center justify-center gap-2",
  monochrome:
    "absolute inset-0 opacity-0 group-hover:opacity-100 [transition:opacity_60ms_steps(1)] bg-foreground flex items-center justify-center gap-2",
  bauhaus:
    "absolute inset-0 opacity-0 group-hover:opacity-100 [transition:opacity_100ms_ease-out] bg-[#F0C020] flex items-center justify-center gap-2",
  linear:
    "absolute inset-0 opacity-0 group-hover:opacity-100 [transition:opacity_300ms_cubic-bezier(0.16,1,0.3,1)] bg-[#050506]/80 backdrop-blur-md flex items-center justify-center gap-3 shadow-[inset_0_0_50px_rgba(94,106,210,0.15)]",
};

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

type FileGridProps = {
  folders: ExplorerFolder[];
  files: ExplorerFile[];
  accounts: LinkedAccount[];
  breadcrumb: BreadcrumbItem[];
  loading: boolean;
  error: string | null;
  selectedFolderId: string | null;
  onRetry: () => void;
  onOpenFolder: (folderId: string) => void;
  onOpenRoot: () => void;
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

function previewTone(status: ExplorerFile["previewStatus"]) {
  if (status === "ready") return "text-emerald-600";
  if (status === "failed") return "text-red-600";
  if (status === "processing") return "text-amber-600";
  return "text-muted-foreground";
}

function fileTypeFromRecord(file: ExplorerFile) {
  if (file.mime?.startsWith("image/")) return "image";
  if (file.mime?.startsWith("video/")) return "video";
  if (file.ext?.toLowerCase() === "arw") return "raw";
  return "doc";
}

export function FileGrid({
  folders,
  files,
  accounts,
  breadcrumb,
  loading,
  error,
  selectedFolderId,
  onRetry,
  onOpenFolder,
  onOpenRoot,
}: FileGridProps) {
  const { ThemeCard, ThemeButton: Button } = useThemeComponents();
  const { theme } = useTheme();
  const name = (theme.name ?? "vivid") as ThemeName;

  const overlayClass = FILE_HOVER_OVERLAY[name];
  const folderHoverClass = FOLDER_CARD_HOVER[name];
  const activeAccount = accounts.find((account) => account.isActive) ?? null;
  const isEmpty = !loading && !error && folders.length === 0 && files.length === 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
      case "raw":
        return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case "video":
        return <Video className="h-8 w-8 text-purple-500" />;
      case "doc":
        return <FileText className="h-8 w-8 text-red-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ThemeCard glass className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Current Path
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium">
            <button type="button" className="underline-offset-4 hover:underline" onClick={onOpenRoot}>
              Root
            </button>
            {breadcrumb.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <span>{item.name}</span>
              </div>
            ))}
            {selectedFolderId ? null : (
              <span className="rounded-[var(--radius-sm)] bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
                Root View
              </span>
            )}
          </div>
        </ThemeCard>

        <ThemeCard glass className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Active Storage
          </p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {activeAccount?.providerMetadata.providerLabel ?? "No active account"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeAccount?.accountEmail ?? "Link a provider to upload or route files."}
          </p>
          {activeAccount ? (
            <p className="mt-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {formatBytes(activeAccount.quotaUsedBytes)} / {formatBytes(activeAccount.quotaTotalBytes)}
            </p>
          ) : null}
        </ThemeCard>
      </section>

      {error ? (
        <ThemeCard className="border border-red-400/40 bg-red-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </ThemeCard>
      ) : null}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Folders
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <ThemeCard key={`folder-skeleton-${index}`} glass className="p-4">
                  <div className="h-20 animate-pulse rounded-[var(--radius)] bg-muted" />
                </ThemeCard>
              ))
            : null}

          {folders.map((folder) => (
            <ThemeCard
              key={folder.id}
              glass
              className={`group flex cursor-pointer items-start gap-4 p-4 ${folderHoverClass}`}
              onClick={() => onOpenFolder(folder.id)}
            >
              <div className="rounded-[var(--radius)] bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">
                <FolderIcon className="h-6 w-6 fill-current opacity-80" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-semibold text-foreground">{folder.name}</h3>
                <p className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {folder.path} · {formatDate(folder.updatedAt)}
                </p>
              </div>
              <button className="text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </ThemeCard>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Files
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            {files.length} files
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <ThemeCard key={`file-skeleton-${index}`} glass className="overflow-hidden">
                  <div className="h-32 animate-pulse bg-muted" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                    <div className="h-3 animate-pulse rounded bg-muted" />
                  </div>
                </ThemeCard>
              ))
            : null}

          {files.map((file) => (
            <ThemeCard key={file.id} glass className="group flex cursor-pointer flex-col overflow-hidden">
              <div className="relative flex h-32 items-center justify-center border-b border-border bg-muted">
                {getIcon(fileTypeFromRecord(file))}

                <span className="absolute left-2 top-2 rounded-[var(--radius-sm)] border border-border bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                  {file.provider === "gdrive" ? "G·Drive" : "OneDrive"}
                </span>

                <div className={overlayClass}>
                  <a href={`/api/files/${file.id}/download`} aria-label={`Download ${file.name}`}>
                    <Button size="icon" className="h-8 w-8 rounded-none">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    title="Share not wired yet"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-card p-3">
                <div className="flex items-start justify-between">
                  <h3 className="truncate pr-2 text-sm font-medium text-foreground" title={file.name}>
                    {file.name}
                  </h3>
                  <button className="shrink-0 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <span>{formatBytes(file.sizeBytes)}</span>
                  <span>{formatDate(file.updatedAt)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
                  <span className={previewTone(file.previewStatus)}>{file.previewStatus}</span>
                  <span className="text-muted-foreground">{file.syncStatus}</span>
                </div>
              </div>
            </ThemeCard>
          ))}
        </div>

        {isEmpty ? (
          <ThemeCard glass className="mt-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No folders or files matched the current backend query.
            </p>
          </ThemeCard>
        ) : null}
      </section>
    </div>
  );
}
