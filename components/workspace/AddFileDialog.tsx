"use client";

import { useState, useEffect, useCallback } from "react";
import { File, Folder, ChevronRight, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/theme/shadcn/dialog";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";
import type { DriveBrowseItem } from "@/lib/contracts";

type AddFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: { id: string; provider: string }[];
  folderId: string | null;
  onSuccess: () => void;
};

async function fetchBrowse(accountId: string, folderId: string | null) {
  const params = new URLSearchParams({ accountId });
  if (folderId) params.set("folderId", folderId);
  const res = await fetch(`/api/storage/drive/browse?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to browse");
  return res.json() as Promise<{ folders: DriveBrowseItem[]; files: DriveBrowseItem[] }>;
}

async function importFile(payload: {
  type: "file";
  accountId: string;
  providerFileId: string;
  name: string;
  folderId?: string | null;
  sizeBytes: number;
  mimeType?: string | null;
}) {
  const res = await fetch("/api/storage/drive/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!res.ok) {
    const msg = data?.error?.message ?? "Failed to import";
    throw new Error(msg);
  }
  return data;
}

export function AddFileDialog({
  open,
  onOpenChange,
  accounts,
  folderId,
  onSuccess,
}: AddFileDialogProps) {
  const { t } = useLocale();
  const { ThemeButton } = useThemeComponents();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [folders, setFolders] = useState<DriveBrowseItem[]>([]);
  const [files, setFiles] = useState<DriveBrowseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveBrowseItem | null>(null);

  const loadBrowse = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBrowse(selectedAccountId, currentFolderId);
      setFolders(data.folders);
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("workspace.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, currentFolderId, t]);

  useEffect(() => {
    if (open && selectedAccountId) {
      void loadBrowse();
    }
  }, [open, selectedAccountId, currentFolderId, loadBrowse]);

  useEffect(() => {
    if (open && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [open, accounts, selectedAccountId]);

  const handleImport = async () => {
    if (importing) return;
    if (!selectedFile || !selectedAccountId) return;
    setImporting(true);
    setError(null);
    try {
      await importFile({
        type: "file",
        accountId: selectedAccountId,
        providerFileId: selectedFile.id,
        name: selectedFile.name,
        folderId: folderId ?? undefined,
        sizeBytes: selectedFile.sizeBytes ?? 0,
        mimeType: selectedFile.mimeType ?? null,
      });
      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("workspace.failedToImport"));
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setError(null);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedFile(null);
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-heading font-bold uppercase tracking-widest">
            {t("workspace.addFile")}
          </DialogTitle>
          <DialogDescription>
            {t("workspace.addFileDescription")}
          </DialogDescription>
        </DialogHeader>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("workspace.linkStorageFirst")}
          </p>
        ) : (
              <div
                id="add-file-import-panel"
                className="space-y-2"
              >
                <div className="flex gap-2">
                  <label htmlFor="add-file-account-import" className="sr-only">
                    {t("workspace.accountForImport")}
                  </label>
                  <select
                    id="add-file-account-import"
                    value={selectedAccountId ?? ""}
                    onChange={(e) => {
                      setSelectedAccountId(e.target.value || null);
                      setCurrentFolderId(null);
                      setCurrentFolderName(null);
                      setSelectedFile(null);
                    }}
                    className="cursor-pointer rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.provider === "gdrive" ? t("vault.googleDrive") : t("vault.oneDrive")}
                      </option>
                    ))}
                  </select>
                  {currentFolderId && (
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentFolderId(null);
                        setCurrentFolderName(null);
                        setSelectedFile(null);
                      }}
                    >
                      {t("workspace.root")}
                    </ThemeButton>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-[var(--radius)] border border-border bg-muted/30 p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {currentFolderId && currentFolderName && (
                        <button
                          type="button"
                          disabled
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground"
                          aria-label={t("workspace.ariaCurrentFolder").replace(/\{name\}/g, currentFolderName)}
                        >
                          <Folder className="h-4 w-4 shrink-0" />
                          {currentFolderName} {t("workspace.currentFolder")}
                        </button>
                      )}
                      {folders.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentFolderId(f.id);
                              setCurrentFolderName(f.name);
                              setSelectedFile(null);
                            }}
                            className="cursor-pointer rounded p-0.5 hover:bg-muted-foreground/20 transition-colors duration-200"
                            aria-label={t("workspace.ariaOpenFolder").replace(/\{name\}/g, f.name)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentFolderId(f.id);
                              setCurrentFolderName(f.name);
                              setSelectedFile(null);
                            }}
                            className="flex flex-1 cursor-pointer items-center gap-2 text-left transition-colors duration-200"
                          >
                            <Folder className="h-4 w-4 shrink-0" />
                            {f.name}
                          </button>
                        </div>
                      ))}
                      {files.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFile(selectedFile?.id === f.id ? null : f)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-200 hover:bg-muted ${
                            selectedFile?.id === f.id ? "font-semibold text-primary" : ""
                          }`}
                        >
                          <File className="h-4 w-4 shrink-0" />
                          {f.name}
                        </button>
                      ))}
                      {folders.length === 0 && files.length === 0 && !loading && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          {t("workspace.noFoldersOrFilesInLocation")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {error && (
                  <p id="add-file-import-error" className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <ThemeButton variant="outline" onClick={handleClose}>
                    {t("common.cancel")}
                  </ThemeButton>
                  <ThemeButton
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                  >
                    {importing ? t("workspace.importing") : t("workspace.import")}
                  </ThemeButton>
                </div>
              </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
