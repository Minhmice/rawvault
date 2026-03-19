"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogHeader,
  DialogDescription,
} from "@/components/theme/shadcn/dialog";
import { AppDialogContent } from "@/components/app/AppDialogContent";
import { AppDialogTitle } from "@/components/app/AppDialogTitle";
import { AppDialogActions } from "@/components/app/AppDialogActions";
import { AppDialogError } from "@/components/app/AppDialogError";
import { AppButton } from "@/components/app/AppButton";
import { AppIconButton } from "@/components/app/AppIconButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CreateShareResponse } from "@/lib/contracts";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "file" | "folder";
  resourceId: string;
  resourceName: string;
  onSuccess?: () => void;
};

function getShareUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/s/${encodeURIComponent(token)}`;
}

type ExpiryPreset = "7d" | "30d" | "never";

function getExpiresAt(preset: ExpiryPreset): string | null {
  if (preset === "never") return null;
  const d = new Date();
  const days = preset === "7d" ? 7 : 30;
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

async function createShare(payload: {
  resource_type: "file" | "folder";
  resource_id: string;
  expires_at?: string | null;
}): Promise<CreateShareResponse["shareLink"]> {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as CreateShareResponse | { error?: { message?: string } };
  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data && data.error?.message
      ? String(data.error.message)
      : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!data || typeof data !== "object" || !("shareLink" in data)) {
    throw new Error("Invalid response");
  }
  return (data as CreateShareResponse).shareLink;
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
  onSuccess,
}: ShareDialogProps) {
  const { t } = useLocale();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateShareResponse["shareLink"] | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");

  useEffect(() => {
    if (open) {
      setError(null);
      setCreatedLink(null);
      setCopied(false);
      setExpiryPreset("never");
    }
  }, [open]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setCreatedLink(null);
    try {
      const expiresAt = getExpiresAt(expiryPreset);
      const link = await createShare({
        resource_type: resourceType,
        resource_id: resourceId,
        expires_at: expiresAt,
      });
      setCreatedLink(link);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("workspace.failedToCreateShareLink"));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    const url = getShareUrl(createdLink.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("workspace.failedToCopy"));
    }
  };

  const handleClose = () => {
    setError(null);
    setCreatedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <AppDialogContent showCloseButton>
        <DialogHeader>
          <AppDialogTitle>
            {resourceType === "file" ? t("workspace.shareFile") : t("workspace.shareFolder")}
          </AppDialogTitle>
          <DialogDescription>
            {t("workspace.shareDescription").replace(/\{name\}/g, resourceName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!createdLink ? (
            <>
              {error && <AppDialogError>{error}</AppDialogError>}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("workspace.linkExpiration")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["never", "7d", "30d"] as const).map((preset) => (
                    <AppButton
                      key={preset}
                      type="button"
                      variant={expiryPreset === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpiryPreset(preset)}
                    >
                      {preset === "never" ? t("workspace.never") : preset === "7d" ? t("workspace.days7") : t("workspace.days30")}
                    </AppButton>
                  ))}
                </div>
              </div>
              <AppDialogActions>
                <AppButton type="button" variant="outline" onClick={handleClose}>
                  {t("common.cancel")}
                </AppButton>
                <AppButton
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("workspace.creatingLink")}
                    </>
                  ) : (
                    t("workspace.createLink")
                  )}
                </AppButton>
              </AppDialogActions>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("workspace.shareLinkCreated")}
              </p>
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2">
                <code className="flex-1 truncate text-xs font-mono text-foreground">
                  {getShareUrl(createdLink.token)}
                </code>
                <AppIconButton
                  variant="outline"
                  onClick={handleCopy}
                  title={t("workspace.copyLink")}
                  aria-label={t("workspace.copyLink")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-rv-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </AppIconButton>
              </div>
              {createdLink.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  {t("workspace.expires")}: {new Date(createdLink.expiresAt).toLocaleString()}
                </p>
              )}
              <AppDialogActions>
                <AppButton type="button" variant="outline" onClick={handleClose}>
                  {t("workspace.done")}
                </AppButton>
              </AppDialogActions>
            </div>
          )}
        </div>
      </AppDialogContent>
    </Dialog>
  );
}
