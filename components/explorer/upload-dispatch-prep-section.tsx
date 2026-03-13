"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchLinkedAccounts, type LinkedAccount } from "../account-management/contracts";
import { ProviderBadge } from "../account-management/provider-badge";
import {
  UPLOAD_EXECUTE_FORM_KEYS,
  type RoutingReason,
  type UploadDispatchRequest,
  type UploadDispatchResponse,
} from "@/lib/contracts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { dispatchUploadPreview, executeUpload } from "./contracts";

type AsyncState = "idle" | "loading" | "error" | "success";

const initialForm: UploadDispatchRequest = {
  fileName: "example.mov",
  sizeBytes: 50 * 1024 * 1024,
  mime: "video/quicktime",
};

const routingReasonLabelMap: Record<RoutingReason, string> = {
  quota_first_highest_remaining: "Highest remaining quota selected.",
  preferred_provider_quota_first: "Preferred provider used with quota-first ranking.",
  preferred_provider_unavailable_fallback_quota_first:
    "Preferred provider was unavailable, so quota-first fallback applied.",
  preferred_account_override: "Preferred account override accepted.",
  preferred_account_unavailable_fallback_quota_first:
    "Preferred account unavailable, so quota-first fallback applied.",
  active_account_unknown_quota_fallback: "Active account selected with unknown quota.",
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const decimals = value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

function accountLabel(account: LinkedAccount): string {
  return (
    account.accountEmail ??
    `${account.providerMetadata.providerLabel} (${account.providerMetadata.accountIdHint})`
  );
}

export function UploadDispatchPrepSection() {
  const [form, setForm] = useState<UploadDispatchRequest>(initialForm);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [accountsState, setAccountsState] = useState<AsyncState>("idle");
  const [accountsErrorMessage, setAccountsErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dispatchResponse, setDispatchResponse] = useState<UploadDispatchResponse | null>(null);
  const [lastPreviewedAt, setLastPreviewedAt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [executeStatus, setExecuteStatus] = useState<AsyncState>("idle");
  const [executeErrorMessage, setExecuteErrorMessage] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<{
    id: string;
    name: string;
    provider: "gdrive" | "onedrive";
  } | null>(null);

  const loadAccounts = useCallback(async (signal?: AbortSignal) => {
    try {
      setAccountsState("loading");
      setAccountsErrorMessage(null);
      const nextAccounts = await fetchLinkedAccounts(signal);
      setAccounts(nextAccounts);
      setAccountsState("success");
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setAccountsState("error");
      setAccountsErrorMessage(
        error instanceof Error ? error.message : "Unable to load linked accounts for routing.",
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadAccounts(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadAccounts]);

  const selectableAccounts = useMemo(() => {
    const filtered = form.preferredProvider
      ? accounts.filter((account) => account.provider === form.preferredProvider)
      : accounts;

    return [...filtered].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }
      return accountLabel(left).localeCompare(accountLabel(right));
    });
  }, [accounts, form.preferredProvider]);

  const selectedPreferredAccountId = useMemo(() => {
    if (!form.preferredAccountId) {
      return undefined;
    }
    const exists = selectableAccounts.some((account) => account.id === form.preferredAccountId);
    return exists ? form.preferredAccountId : undefined;
  }, [form.preferredAccountId, selectableAccounts]);

  const selectedPreferredAccount = useMemo(() => {
    if (!selectedPreferredAccountId) {
      return null;
    }
    return accounts.find((account) => account.id === selectedPreferredAccountId) ?? null;
  }, [accounts, selectedPreferredAccountId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
    if (file) {
      setForm((current) => ({
        ...current,
        fileName: file.name,
        sizeBytes: file.size,
        mime: file.type || undefined,
      }));
    }
  };

  const handleExecuteUpload = async () => {
    if (!selectedFile) {
      return;
    }
    try {
      setExecuteStatus("loading");
      setExecuteErrorMessage(null);
      setExecuteResult(null);
      const formData = new FormData();
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.file, selectedFile);
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.fileName, form.fileName);
      formData.append(UPLOAD_EXECUTE_FORM_KEYS.sizeBytes, String(form.sizeBytes));
      if (form.mime) {
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.mime, form.mime);
      }
      if (form.folderId) {
        formData.append(UPLOAD_EXECUTE_FORM_KEYS.folderId, form.folderId);
      }
      if (form.preferredProvider) {
        formData.append(
          UPLOAD_EXECUTE_FORM_KEYS.preferredProvider,
          form.preferredProvider,
        );
      }
      if (selectedPreferredAccountId) {
        formData.append(
          UPLOAD_EXECUTE_FORM_KEYS.preferredAccountId,
          selectedPreferredAccountId,
        );
      }
      const response = await executeUpload(formData);
      setExecuteResult({
        id: response.file.id,
        name: response.file.name,
        provider: response.file.provider,
      });
      setExecuteStatus("success");
    } catch (error) {
      setExecuteStatus("error");
      setExecuteErrorMessage(
        error instanceof Error ? error.message : "Upload failed.",
      );
    }
  };

  const handlePreview = async () => {
    try {
      setStatus("loading");
      setErrorMessage(null);
      setDispatchResponse(null);
      const next = await dispatchUploadPreview({
        ...form,
        preferredAccountId: selectedPreferredAccountId,
      });
      setDispatchResponse(next);
      setLastPreviewedAt(new Date().toLocaleTimeString());
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to preview dispatch.");
    }
  };

  const selectedDispatchAccount = useMemo(() => {
    if (!dispatchResponse) {
      return null;
    }
    return accounts.find((account) => account.id === dispatchResponse.dispatch.storageAccountId) ?? null;
  }, [accounts, dispatchResponse]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload dispatch prep</CardTitle>
        <CardDescription>
          Select a file to upload or use the form to preview dispatch routing. Upload executes via{" "}
          <code>POST /api/uploads/execute</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="rv-stack">
        <section className="rv-stack" aria-label="Upload execute">
          <label className="rv-field">
            <span className="rv-field-label">File</span>
            <input
              type="file"
              className="rv-input"
              onChange={handleFileChange}
              accept="*/*"
              aria-describedby="file-upload-hint"
            />
            <span id="file-upload-hint" className="rv-muted">
              Select a file to upload. Form fields below will sync from the selected file.
            </span>
          </label>
          {selectedFile ? (
            <p className="rv-muted" aria-live="polite">
              Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
            </p>
          ) : null}
          <div className="rv-actions">
            <Button
              type="button"
              disabled={!selectedFile || executeStatus === "loading"}
              onClick={handleExecuteUpload}
              aria-busy={executeStatus === "loading"}
            >
              {executeStatus === "loading" ? "Uploading..." : "Upload file"}
            </Button>
          </div>
          {executeStatus === "loading" ? (
            <div className="rv-list" aria-live="polite" aria-busy="true">
              <Skeleton height={44} />
            </div>
          ) : null}
          {executeStatus === "error" && executeErrorMessage ? (
            <div className="rv-alert" role="alert">
              <p>Upload failed: {executeErrorMessage}</p>
            </div>
          ) : null}
          {executeStatus === "success" && executeResult ? (
            <div className="rv-inline" aria-live="polite">
              <strong>Uploaded:</strong>
              <span>{executeResult.name}</span>
              <Badge tone="success">{executeResult.id}</Badge>
              <ProviderBadge provider={executeResult.provider} />
            </div>
          ) : null}
        </section>

        <section className="rv-explorer-controls" aria-label="Dispatch intent form">
          <label className="rv-field">
            <span className="rv-field-label">File name</span>
            <input
              className="rv-input"
              value={form.fileName}
              onChange={(event) => {
                const value = event.currentTarget?.value ?? "";
                setForm((current) => ({ ...current, fileName: value }));
              }}
            />
          </label>

          <label className="rv-field">
            <span className="rv-field-label">Size bytes</span>
            <input
              className="rv-input"
              type="number"
              min={0}
              value={String(form.sizeBytes)}
              onChange={(event) => {
                const value = event.currentTarget?.value ?? "0";
                setForm((current) => ({
                  ...current,
                  sizeBytes: Number(value) || 0,
                }));
              }}
            />
          </label>

          <label className="rv-field">
            <span className="rv-field-label">MIME</span>
            <input
              className="rv-input"
              value={form.mime ?? ""}
              onChange={(event) => {
                const value = event.currentTarget?.value ?? "";
                setForm((current) => ({
                  ...current,
                  mime: value || undefined,
                }));
              }}
            />
          </label>

          <label className="rv-field">
            <span className="rv-field-label">Preferred provider</span>
            <select
              className="rv-select"
              value={form.preferredProvider ?? "none"}
              onChange={(event) => {
                const value = event.currentTarget?.value ?? "none";
                setForm((current) => {
                  const nextProvider =
                    value === "none"
                      ? undefined
                      : (value as NonNullable<
                          UploadDispatchRequest["preferredProvider"]
                        >);
                  const nextSelectableAccounts = nextProvider
                    ? accounts.filter((account) => account.provider === nextProvider)
                    : accounts;
                  const keepPreferredAccount = current.preferredAccountId
                    ? nextSelectableAccounts.some(
                        (account) => account.id === current.preferredAccountId,
                      )
                    : false;

                  return {
                    ...current,
                    preferredProvider: nextProvider,
                    preferredAccountId: keepPreferredAccount
                      ? current.preferredAccountId
                      : undefined,
                  };
                });
              }}
            >
              <option value="none">No preference</option>
              <option value="gdrive">Google Drive</option>
              <option value="onedrive">OneDrive</option>
            </select>
          </label>

          <label className="rv-field">
            <span className="rv-field-label">Preferred account (optional)</span>
            <select
              className="rv-select"
              value={selectedPreferredAccountId ?? "none"}
              disabled={accountsState === "loading" || selectableAccounts.length === 0}
              onChange={(event) => {
                const value = event.currentTarget?.value ?? "none";
                setForm((current) => ({
                  ...current,
                  preferredAccountId: value === "none" ? undefined : value,
                }));
              }}
            >
              <option value="none">No account preference</option>
              {selectableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {accountLabel(account)}
                  {account.isActive ? " (active)" : ""}
                </option>
              ))}
            </select>
          </label>
        </section>

        {accountsState === "loading" ? (
          <div className="rv-list" aria-live="polite" aria-busy="true">
            <Skeleton height={44} />
          </div>
        ) : null}

        {accountsState === "error" && accountsErrorMessage ? (
          <div className="rv-alert" role="alert">
            <p>{accountsErrorMessage}</p>
            <Button
              type="button"
              variant="link"
              onClick={async () => {
                await loadAccounts();
              }}
            >
              Retry account options
            </Button>
          </div>
        ) : null}

        {accountsState === "success" ? (
          <section className="rv-row" aria-label="Dispatch readiness">
            <div className="rv-inline">
              <strong>Dispatch readiness:</strong>
              <Badge tone={accounts.length > 0 ? "success" : "muted"}>
                {accounts.length > 0 ? "Accounts available" : "No linked accounts"}
              </Badge>
            </div>
            <p className="rv-muted">
              {selectableAccounts.length > 0
                ? `${selectableAccounts.length} preferred account option${
                    selectableAccounts.length === 1 ? "" : "s"
                  } available for current provider filter.`
                : form.preferredProvider
                  ? "No linked accounts available for this provider."
                  : "No linked accounts available yet. Seed/link accounts before dispatch verification."}
            </p>
          </section>
        ) : null}

        {selectedPreferredAccount ? (
          <div className="rv-inline">
            <span className="rv-muted">Selected account preference:</span>
            <ProviderBadge provider={selectedPreferredAccount.provider} />
            <span>{accountLabel(selectedPreferredAccount)}</span>
          </div>
        ) : null}

        <div className="rv-actions">
          <Button type="button" disabled={status === "loading"} onClick={handlePreview}>
            {status === "loading" ? "Evaluating route..." : "Preview dispatch decision"}
          </Button>
        </div>

        <div className="rv-inline" aria-live="polite">
          <strong>Dispatch preview status:</strong>
          <Badge tone={status === "success" ? "success" : status === "idle" ? "muted" : "default"}>
            {status === "success"
              ? "Verification result available"
              : status === "loading"
                ? "Running verification"
                : status === "error"
                  ? "Verification failed"
                  : "Not run yet"}
          </Badge>
          {lastPreviewedAt ? <span className="rv-muted">Last check: {lastPreviewedAt}</span> : null}
        </div>

        {status === "loading" ? (
          <div className="rv-list" aria-live="polite" aria-busy="true">
            <Skeleton height={84} />
          </div>
        ) : null}

        {status === "error" && errorMessage ? (
          <div className="rv-alert" role="alert">
            <p>Dispatch verification failed: {errorMessage}</p>
          </div>
        ) : null}

        {status === "success" && dispatchResponse ? (
          <section className="rv-stack" aria-label="Dispatch preview result">
            <article className="rv-row">
              <div className="rv-inline">
                <strong>Dispatch verification:</strong>
                <Badge tone="success">PASS - decision returned</Badge>
              </div>
              <p className="rv-muted">
                Use the fields below to verify provider/account routing and fallback behavior.
              </p>
            </article>
            <article className="rv-row">
              <div className="rv-inline">
                <strong>Decision:</strong>
                <Badge tone="success">Dispatchable</Badge>
              </div>
              <div className="rv-meta">
                <span>
                  Routing reason: {routingReasonLabelMap[dispatchResponse.dispatch.reason]} (
                  {dispatchResponse.dispatch.reason})
                </span>
                <span>
                  Requested size: {formatBytes(form.sizeBytes)} | Estimated remaining:{" "}
                  {dispatchResponse.dispatch.remainingQuotaBytes === null
                    ? "-"
                    : formatBytes(dispatchResponse.dispatch.remainingQuotaBytes)}
                </span>
                <span>Provider route: {dispatchResponse.dispatch.plan.providerRoute}</span>
                <span>Candidate checks: {dispatchResponse.dispatch.triedAccountIds.length}</span>
                <span>
                  Tried account IDs:{" "}
                  {dispatchResponse.dispatch.triedAccountIds.length > 0
                    ? dispatchResponse.dispatch.triedAccountIds.join(", ")
                    : "none"}
                </span>
              </div>
              <div className="rv-inline">
                <ProviderBadge provider={dispatchResponse.dispatch.provider} />
                <span>
                  {selectedDispatchAccount
                    ? accountLabel(selectedDispatchAccount)
                    : dispatchResponse.dispatch.storageAccountId}
                </span>
                <span className="rv-muted">{dispatchResponse.dispatch.storageAccountId}</span>
              </div>
            </article>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
