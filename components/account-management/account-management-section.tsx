"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountRow } from "./account-row";
import {
  fetchLinkedAccounts,
  readProviderConnectCallback,
  setActiveProviderAccount,
  startProviderConnect,
  stripProviderConnectCallback,
  unlinkProviderAccount,
  type LinkedAccount,
  type Provider,
} from "./contracts";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type AsyncState = "idle" | "loading" | "error" | "success";

const linkableProviders: Provider[] = ["gdrive", "onedrive"];

function providerLabel(provider: Provider): string {
  return provider === "gdrive" ? "Google Drive" : "OneDrive";
}

function providerActionLabel(provider: Provider): string {
  return `Connect ${providerLabel(provider)}`;
}

export function AccountManagementSection() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [status, setStatus] = useState<AsyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectFlowError, setConnectFlowError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
  const [busyUnlinkId, setBusyUnlinkId] = useState<string | null>(null);
  const [busySetActiveId, setBusySetActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAccounts = useCallback(async (signal?: AbortSignal) => {
    try {
      setStatus("loading");
      setErrorMessage(null);
      const nextAccounts = await fetchLinkedAccounts(signal);
      setAccounts(nextAccounts);
      setStatus("success");
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      const message = error instanceof Error ? error.message : "Unable to load linked accounts.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAccounts(controller.signal);
    return () => controller.abort();
  }, [loadAccounts]);

  useEffect(() => {
    const callbackState = readProviderConnectCallback(window.location.search);
    if (!callbackState) {
      return;
    }

    if (callbackState.status === "success") {
      setErrorMessage(null);
      setConnectFlowError(null);
      setNotice(callbackState.message ?? `${providerLabel(callbackState.provider)} connected.`);
      void loadAccounts();
    } else if (callbackState.status === "cancelled") {
      setErrorMessage(null);
      setConnectFlowError(
        callbackState.message ?? `${providerLabel(callbackState.provider)} connect was cancelled.`,
      );
      setNotice(null);
    } else {
      setErrorMessage(null);
      setConnectFlowError(
        callbackState.message ?? `Unable to connect ${providerLabel(callbackState.provider)}.`,
      );
      setNotice(null);
    }

    const nextQuery = stripProviderConnectCallback(window.location.search);
    const nextUrl = `${window.location.pathname}${nextQuery}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [loadAccounts]);

  const handleConnectAccount = useCallback(async (provider: Provider) => {
    try {
      setBusyProvider(provider);
      setErrorMessage(null);
      setConnectFlowError(null);
      setNotice(null);

      const returnTo = `${window.location.pathname}${stripProviderConnectCallback(
        window.location.search,
      )}`;
      await startProviderConnect(provider, returnTo);
      setNotice(
        `${providerLabel(provider)} connect flow started. Finish in provider auth and return here.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Unable to start ${providerLabel(provider)} connect flow.`;
      setConnectFlowError(message);
    } finally {
      setBusyProvider(null);
    }
  }, []);

  const handleUnlinkAccount = useCallback(async (accountId: string) => {
    try {
      setBusyUnlinkId(accountId);
      setConnectFlowError(null);
      setNotice(null);
      await unlinkProviderAccount(accountId);
      setNotice("Account unlinked.");
      await loadAccounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to unlink account.";
      setErrorMessage(message);
      setStatus("error");
    } finally {
      setBusyUnlinkId(null);
    }
  }, [loadAccounts]);

  const handleSetActiveAccount = useCallback(async (accountId: string) => {
    try {
      setBusySetActiveId(accountId);
      setConnectFlowError(null);
      setNotice(null);
      await setActiveProviderAccount(accountId);
      setNotice("Active account updated.");
      await loadAccounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to set active account.";
      setErrorMessage(message);
      setStatus("error");
    } finally {
      setBusySetActiveId(null);
    }
  }, [loadAccounts]);

  const isLoading = status === "loading";
  const hasAccounts = accounts.length > 0;
  const showEmpty = status === "success" && !hasAccounts;
  const showError = status === "error";

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      const leftKey = left.accountEmail ?? left.providerAccountId;
      const rightKey = right.accountEmail ?? right.providerAccountId;
      return leftKey.localeCompare(rightKey);
    });
  }, [accounts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked accounts</CardTitle>
        <CardDescription>
          Connect storage providers to expand capacity. This view uses foundation contracts
          (`/api/storage/accounts`) and minimal connect/callback wiring for phase-4 OAuth.
        </CardDescription>
      </CardHeader>

      <CardContent className="rv-stack">
        <section className="rv-actions" aria-label="Link provider account">
          {linkableProviders.map((provider) => (
            <Button
              key={provider}
              variant="secondary"
              disabled={
                busyProvider !== null ||
                busyUnlinkId !== null ||
                busySetActiveId !== null
              }
              onClick={async () => {
                await handleConnectAccount(provider);
              }}
            >
              {busyProvider === provider ? "Connecting..." : providerActionLabel(provider)}
            </Button>
          ))}
        </section>

        {notice ? <p className="rv-muted">{notice}</p> : null}

        {connectFlowError ? (
          <div className="rv-alert" role="alert">
            <p>{connectFlowError}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rv-list" aria-live="polite" aria-busy="true">
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
        ) : null}

        {showError && errorMessage ? (
          <div className="rv-alert" role="alert">
            <p>{errorMessage}</p>
            <Button
              variant="link"
              onClick={async () => {
                await loadAccounts();
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="rv-empty">
            <p>No linked accounts yet.</p>
            <p className="rv-muted">Use a provider button above to start your first connection.</p>
          </div>
        ) : null}

        {!isLoading && hasAccounts ? (
          <section className="rv-list" aria-label="Linked account list">
            {sortedAccounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                busy={busyUnlinkId === account.id || busySetActiveId === account.id}
                canUnlink={!(account.isActive && sortedAccounts.length > 1)}
                onSetActive={handleSetActiveAccount}
                onUnlink={handleUnlinkAccount}
              />
            ))}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
