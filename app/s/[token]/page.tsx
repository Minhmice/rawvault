"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Folder as FolderIcon,
  Download,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Video,
} from "lucide-react";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useThemeComponents } from "@/components/themes";
import type { ResolveShareResponse } from "@/lib/contracts";

type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";

const SHARE_VIEW_HEADER_THEME: Record<ThemeName, string> = {
  vivid: "border-b border-border bg-muted/20 px-4 py-4",
  monochrome: "border-b-4 border-foreground bg-card px-4 py-4",
  bauhaus: "border-b-4 border-foreground bg-card px-4 py-4",
  linear: "border-b border-border bg-card/50 px-4 py-4",
};

const SHARE_VIEW_TITLE_CLASS: Record<ThemeName, string> = {
  vivid: "text-center text-lg font-heading font-bold uppercase tracking-widest text-foreground",
  monochrome: "text-center text-lg font-heading font-bold uppercase tracking-wider text-foreground",
  bauhaus: "text-center text-lg font-heading font-black uppercase tracking-tighter text-foreground",
  linear: "text-center text-lg font-heading font-semibold tracking-wide text-foreground",
};

type ResolveShareLink = ResolveShareResponse["shareLink"];

type SharedFolderItem = {
  id: string;
  name: string;
  mimeType?: string | null;
  isFolder: boolean;
};

type FolderResponse = {
  folders: Array<{ id: string; name: string }>;
  files: Array<{ id: string; name: string; mimeType?: string | null }>;
};

function isImageFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic"].includes(ext ?? "");
}

function isVideoFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext ?? "");
}

function getStreamUrl(token: string, fileId?: string): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.origin}/api/share/v/${token}/stream`;
  return fileId ? `${base}?fileId=${encodeURIComponent(fileId)}` : base;
}

function ShareViewContent({
  token,
  shareLink,
}: {
  token: string;
  shareLink: ResolveShareLink;
}) {
  const { t } = useLocale();
  const { ThemeButton } = useThemeComponents();
  const streamUrl = getStreamUrl(token);
  const isImage = isImageFile(shareLink.resourceName);
  const isVideo = isVideoFile(shareLink.resourceName);
  const canPreview = isImage || isVideo;

  if (shareLink.resourceType === "file") {
    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-lg font-semibold text-foreground" id="shared-file-name">
          {shareLink.resourceName}
        </h2>

        {canPreview ? (
          <div className="w-full max-w-3xl overflow-hidden rounded-[var(--radius)] border border-border bg-muted/30">
            {isImage ? (
              <img
                src={streamUrl}
                alt={shareLink.resourceName}
                className="max-h-[70vh] w-full object-contain"
                aria-describedby="shared-file-name"
              />
            ) : (
              <video
                src={streamUrl}
                controls
                className="max-h-[70vh] w-full"
                aria-label={t("s.ariaVideo").replace(/\{name\}/g, shareLink.resourceName)}
              >
                {t("s.videoNotSupported")}
              </video>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-border bg-muted/30 p-12"
            role="img"
            aria-label={t("s.ariaFile").replace(/\{name\}/g, shareLink.resourceName)}
          >
            <FileText className="h-16 w-16 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{shareLink.resourceName}</span>
          </div>
        )}

        {shareLink.allowDownload && (
          <ThemeButton
            className="inline-flex items-center gap-2 animate-enter"
            aria-label={t("s.ariaDownload").replace(/\{name\}/g, shareLink.resourceName)}
            onClick={() => {
              const a = document.createElement("a");
              a.href = streamUrl;
              a.download = shareLink.resourceName;
              a.click();
            }}
          >
            <Download className="h-4 w-4" />
            {t("s.download")}
          </ThemeButton>
        )}
      </div>
    );
  }

  return (
    <ShareFolderView token={token} shareLink={shareLink} />
  );
}

function ShareFolderView({
  token,
  shareLink,
}: {
  token: string;
  shareLink: ResolveShareLink;
}) {
  const { t } = useLocale();
  const { ThemeButton, ThemeCard } = useThemeComponents();
  const [items, setItems] = useState<SharedFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/v/${token}/folder`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error?.message ?? t("s.failedToLoadFolder").replace(/\{status\}/g, String(res.status));
        throw new Error(msg);
      }
      const data = (await res.json()) as FolderResponse;
      const folders: SharedFolderItem[] = (data.folders ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        isFolder: true,
      }));
      const files: SharedFolderItem[] = (data.files ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType ?? null,
        isFolder: false,
      }));
      setItems([...folders, ...files]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("s.loadingFolderContents"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void loadFolder();
  }, [loadFolder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("s.loadingFolderContents")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-6"
        role="alert"
      >
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <ThemeButton variant="outline" size="sm" onClick={loadFolder}>
          {t("s.retry")}
        </ThemeButton>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-[var(--radius)] border border-border bg-muted/30 p-8 text-center"
        role="status"
      >
        <p className="text-sm text-muted-foreground">{t("s.folderEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground" id="folder-contents-heading">
        {t("s.contentsOf").replace(/\{name\}/g, shareLink.resourceName)}
      </h2>
      <ul
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-labelledby="folder-contents-heading"
        role="list"
      >
        {items.map((item) => (
          <li key={item.id} role="listitem">
            {item.isFolder ? (
              <ThemeCard
                glass
                className="flex cursor-default items-center gap-3 p-4 opacity-75"
                aria-label={t("s.ariaFolder").replace(/\{name\}/g, item.name)}
              >
                <FolderIcon className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate text-sm font-medium text-foreground">
                  {item.name}
                </span>
              </ThemeCard>
            ) : (
              <ThemeCard glass className="flex items-center gap-3 p-4">
                <div className="shrink-0 text-muted-foreground">
                  {isImageFile(item.name) ? (
                    <ImageIcon className="h-8 w-8" aria-hidden />
                  ) : isVideoFile(item.name) ? (
                    <Video className="h-8 w-8" aria-hidden />
                  ) : (
                    <FileText className="h-8 w-8" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                </div>
                {shareLink.allowDownload && (
                  <ThemeButton
                    variant="outline"
                    size="sm"
                    className="shrink-0 animate-enter"
                    aria-label={t("s.ariaDownload").replace(/\{name\}/g, item.name)}
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = getStreamUrl(token, item.id);
                      a.download = item.name;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </ThemeButton>
                )}
              </ThemeCard>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ShareViewPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const { t } = useLocale();
  const { theme } = useTheme();
  const { ThemeButton: RetryButton } = useThemeComponents();
  const themeName = (theme?.name ?? "vivid") as ThemeName;
  const headerClass = SHARE_VIEW_HEADER_THEME[themeName] ?? SHARE_VIEW_HEADER_THEME.vivid;
  const titleClass = SHARE_VIEW_TITLE_CLASS[themeName] ?? SHARE_VIEW_TITLE_CLASS.vivid;

  const [shareLink, setShareLink] = useState<ResolveShareLink | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "404" | "410" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchResolve = useCallback(async () => {
    if (!token) {
      setStatus("404");
      setErrorMessage(t("s.invalidShareLink"));
      return;
    }
    setStatus("loading");
    setShareLink(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/share/resolve/${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => null);

      if (res.status === 404) {
        setStatus("404");
        setErrorMessage(
          data?.error?.message ?? t("s.shareNotFoundOrRemoved")
        );
        return;
      }
      if (res.status === 410) {
        setStatus("410");
        setErrorMessage(
          data?.error?.message ?? t("s.shareExpiredOrRevoked")
        );
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? t("s.somethingWentWrong"));
        return;
      }
      if (!data?.shareLink) {
        setStatus("error");
        setErrorMessage(t("s.somethingWentWrong"));
        return;
      }
      setShareLink(data.shareLink);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(t("s.loadingSharedContent"));
    }
  }, [token, t]);

  useEffect(() => {
    void fetchResolve();
  }, [fetchResolve]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 animate-enter">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("s.loadingSharedContent")}
        </p>
      </div>
    );
  }

  if (status === "404" || status === "410" || status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <header className="text-center">
          <h1 className={titleClass}>{t("s.sharedWithYou")}</h1>
        </header>
        <div
          className="flex max-w-md flex-col items-center gap-4 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-8 text-center animate-enter"
          role="alert"
        >
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">
            {status === "404"
              ? t("s.linkNotFound")
              : status === "410"
                ? t("s.linkExpiredOrRevoked")
                : t("s.somethingWentWrong")}
          </h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <RetryButton variant="outline" size="sm" onClick={() => void fetchResolve()}>
            {t("s.retry")}
          </RetryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className={headerClass}>
        <h1 className={titleClass}>{t("s.sharedWithYou")}</h1>
      </header>
      <main className="flex-1 px-4 py-8 animate-enter" role="main">
        {shareLink && <ShareViewContent token={token} shareLink={shareLink} />}
      </main>
    </div>
  );
}
