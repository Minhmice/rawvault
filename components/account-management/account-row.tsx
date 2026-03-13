import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { LinkedAccount } from "./contracts";
import { ProviderBadge } from "./provider-badge";

type AccountRowProps = {
  account: LinkedAccount;
  busy: boolean;
  canUnlink: boolean;
  onSetActive: (accountId: string) => Promise<void>;
  onUnlink: (accountId: string) => Promise<void>;
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

function formatQuota(account: LinkedAccount): string {
  const used = formatBytes(account.quotaUsedBytes);
  const total = formatBytes(account.quotaTotalBytes);
  return `${used} / ${total}`;
}

function accountDisplayLabel(account: LinkedAccount): string {
  if (account.accountEmail) {
    return account.accountEmail;
  }
  return `${account.providerMetadata.providerLabel} (${account.providerMetadata.accountIdHint})`;
}

function tokenLifecycleSummary(account: LinkedAccount): string {
  switch (account.tokenLifecycle.status) {
    case "valid":
      return "Token state: valid.";
    case "expiring_soon":
      return "Token state: expiring soon.";
    case "expired":
      return "Token state: expired.";
    case "missing":
      return "Token state: missing.";
    default:
      return "Token state: unknown.";
  }
}

function getAccountStateBadge(account: LinkedAccount): {
  label: string;
  tone: "default" | "success" | "muted";
  summary: string;
} {
  switch (account.status) {
    case "active":
      return {
        label: "Active",
        tone: "success",
        summary: "Ready for routing and upload dispatch.",
      };
    case "inactive":
      return {
        label: "Inactive",
        tone: "muted",
        summary: "Connected but not selected as active.",
      };
    case "reauth_required":
      return {
        label: "Re-auth required",
        tone: "default",
        summary: "Provider token appears expired or invalid.",
      };
    case "error":
      return {
        label: "Error",
        tone: "default",
        summary: "Provider account needs recovery before reliable use.",
      };
    default:
      return {
        label: "Inactive",
        tone: "muted",
        summary: "Connected but not selected as active.",
      };
  }
}

export function AccountRow({
  account,
  busy,
  canUnlink,
  onSetActive,
  onUnlink,
}: AccountRowProps) {
  const stateBadge = getAccountStateBadge(account);
  const displayLabel = accountDisplayLabel(account);

  return (
    <article className="rv-row">
      <div className="rv-row-top">
        <div className="rv-stack" style={{ gap: "0.45rem" }}>
          <div className="rv-inline">
            <ProviderBadge provider={account.provider} />
            <Badge tone={stateBadge.tone}>{stateBadge.label}</Badge>
          </div>
          <div>
            <strong>{displayLabel}</strong>
          </div>
          <div className="rv-meta">
            <span>Quota: {formatQuota(account)}</span>
            <span>State: {stateBadge.summary}</span>
            <span>Provider health: {account.providerMetadata.healthStatus}</span>
            <span>{tokenLifecycleSummary(account)}</span>
          </div>
        </div>
        <div className="rv-actions">
          {!account.isActive ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                await onSetActive(account.id);
              }}
              aria-label={`Set ${displayLabel} as active`}
            >
              Set active
            </Button>
          ) : null}
          <Button
            variant="danger"
            disabled={busy || !canUnlink}
            onClick={async () => {
              await onUnlink(account.id);
            }}
            aria-label={`Unlink ${displayLabel}`}
            title={
              !canUnlink
                ? "Set another account active before unlinking this one."
                : undefined
            }
          >
            Unlink account
          </Button>
        </div>
      </div>
    </article>
  );
}
