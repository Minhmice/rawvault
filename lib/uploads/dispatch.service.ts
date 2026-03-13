import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type {
  AccountProvider,
  RoutingReason,
  UploadDispatchPlan,
  UploadDispatchRequest,
  UploadDispatchResponse,
} from "@/lib/contracts";
import {
  uploadDispatchRequestSchema,
  uploadDispatchResponseSchema,
} from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";

type LinkedAccountRow = {
  id: string;
  provider: AccountProvider;
  account_email: string | null;
  quota_total_bytes: number | null;
  quota_used_bytes: number | null;
  is_active: boolean;
  health_status: "healthy" | "degraded" | "error";
  expires_at: string | null;
};

type EvaluatedAccount = {
  account: LinkedAccountRow;
  eligible: boolean;
  remainingQuotaBytes: number | null;
  ineligibleReason?: string;
};

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request payload.", {
      fields: z.flattenError(parsed.error).fieldErrors,
    });
  }
  return parsed.data;
}

function toRemainingQuotaBytes(account: LinkedAccountRow): number | null {
  if (
    account.quota_total_bytes === null ||
    account.quota_used_bytes === null ||
    account.quota_total_bytes < account.quota_used_bytes
  ) {
    return null;
  }
  return account.quota_total_bytes - account.quota_used_bytes;
}

function evaluateAccount(account: LinkedAccountRow, sizeBytes: number): EvaluatedAccount {
  const remainingQuotaBytes = toRemainingQuotaBytes(account);

  if (account.health_status === "error") {
    return {
      account,
      eligible: false,
      remainingQuotaBytes,
      ineligibleReason: "account_health_error",
    };
  }

  if (account.expires_at && new Date(account.expires_at).getTime() <= Date.now()) {
    return {
      account,
      eligible: false,
      remainingQuotaBytes,
      ineligibleReason: "account_token_expired",
    };
  }

  if (remainingQuotaBytes !== null && remainingQuotaBytes < sizeBytes) {
    return {
      account,
      eligible: false,
      remainingQuotaBytes,
      ineligibleReason: "account_quota_insufficient",
    };
  }

  return {
    account,
    eligible: true,
    remainingQuotaBytes,
  };
}

function compareQuotaFirst(left: EvaluatedAccount, right: EvaluatedAccount): number {
  const leftKnown = left.remainingQuotaBytes !== null;
  const rightKnown = right.remainingQuotaBytes !== null;

  if (leftKnown !== rightKnown) {
    return leftKnown ? -1 : 1;
  }

  if (left.remainingQuotaBytes !== right.remainingQuotaBytes) {
    return (right.remainingQuotaBytes ?? 0) - (left.remainingQuotaBytes ?? 0);
  }

  if (left.account.is_active !== right.account.is_active) {
    return left.account.is_active ? -1 : 1;
  }

  return left.account.id.localeCompare(right.account.id);
}

function mapRoutingReason(
  request: UploadDispatchRequest,
  selected: EvaluatedAccount,
  fallbackFromAccountId?: string,
): RoutingReason {
  if (request.preferredAccountId) {
    return fallbackFromAccountId
      ? "preferred_account_unavailable_fallback_quota_first"
      : "preferred_account_override";
  }
  if (request.preferredProvider) {
    return selected.account.provider === request.preferredProvider
      ? "preferred_provider_quota_first"
      : "preferred_provider_unavailable_fallback_quota_first";
  }
  return selected.remainingQuotaBytes === null && selected.account.is_active
    ? "active_account_unknown_quota_fallback"
    : "quota_first_highest_remaining";
}

function providerRoute(provider: AccountProvider): UploadDispatchPlan["providerRoute"] {
  return provider === "gdrive" ? "gdrive.upload" : "onedrive.upload";
}

function buildTriedAccountIds(
  evaluated: EvaluatedAccount[],
  preferredAccountId?: string,
): string[] {
  const ranked = [...evaluated].sort(compareQuotaFirst).map((entry) => entry.account.id);
  if (!preferredAccountId) {
    return ranked;
  }
  return [preferredAccountId, ...ranked.filter((id) => id !== preferredAccountId)];
}

async function writeDispatchLog(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "upload_dispatch_decision",
    resource_type: null,
    resource_id: null,
    payload,
  });

  if (error) {
    throw new ApiError(
      500,
      "ACTIVITY_LOG_WRITE_FAILED",
      "Failed to write dispatch activity log.",
      error.message,
    );
  }
}

export async function dispatchUploadTarget(
  supabase: SupabaseClient,
  userId: string,
  input: UploadDispatchRequest,
): Promise<UploadDispatchResponse> {
  const parsedInput = parseInput(uploadDispatchRequestSchema, input);

  const { data, error } = await supabase
    .from("linked_accounts")
    .select(
      "id, provider, account_email, quota_total_bytes, quota_used_bytes, is_active, health_status, expires_at",
    )
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(
      500,
      "UPLOAD_DISPATCH_LOOKUP_FAILED",
      "Failed to load linked accounts for dispatch.",
      error.message,
    );
  }

  const linkedAccounts = (data ?? []) as LinkedAccountRow[];
  if (linkedAccounts.length === 0) {
    throw new ApiError(
      409,
      "NO_LINKED_ACCOUNTS",
      "No linked storage accounts available for upload dispatch.",
    );
  }

  const evaluatedAccounts = linkedAccounts.map((account) =>
    evaluateAccount(account, parsedInput.sizeBytes),
  );
  const rankedEligible = evaluatedAccounts
    .filter((account) => account.eligible)
    .sort(compareQuotaFirst);

  let fallbackFromAccountId: string | undefined;
  let selected: EvaluatedAccount | undefined;

  if (parsedInput.preferredAccountId) {
    const preferred = evaluatedAccounts.find(
      (account) => account.account.id === parsedInput.preferredAccountId,
    );

    if (!preferred) {
      throw new ApiError(
        404,
        "PREFERRED_ACCOUNT_NOT_FOUND",
        "Preferred storage account not found.",
      );
    }

    if (preferred.eligible) {
      selected = preferred;
    } else {
      selected = rankedEligible.find(
        (candidate) => candidate.account.id !== parsedInput.preferredAccountId,
      );
      fallbackFromAccountId = preferred.account.id;
    }
  } else if (parsedInput.preferredProvider) {
    selected = rankedEligible.find(
      (candidate) => candidate.account.provider === parsedInput.preferredProvider,
    );

    if (!selected) {
      selected = rankedEligible[0];
      fallbackFromAccountId = evaluatedAccounts.find(
        (candidate) => candidate.account.provider === parsedInput.preferredProvider,
      )?.account.id;
    }
  } else {
    selected = rankedEligible[0];
  }

  if (!selected) {
    throw new ApiError(
      409,
      "NO_ELIGIBLE_ACCOUNT",
      "No eligible linked account can accept this upload.",
      {
        accounts: evaluatedAccounts.map((item) => ({
          id: item.account.id,
          provider: item.account.provider,
          ineligibleReason: item.ineligibleReason ?? null,
        })),
      },
    );
  }

  const routingReason = mapRoutingReason(parsedInput, selected, fallbackFromAccountId);
  const dispatchId = crypto.randomUUID();

  const response = uploadDispatchResponseSchema.parse({
    success: true,
    dispatch: {
      provider: selected.account.provider,
      storageAccountId: selected.account.id,
      reason: routingReason,
      remainingQuotaBytes: selected.remainingQuotaBytes,
      triedAccountIds: buildTriedAccountIds(evaluatedAccounts, parsedInput.preferredAccountId),
      plan: {
        providerRoute: providerRoute(selected.account.provider),
        executionMode: "dispatch_only",
      },
    },
  });

  await writeDispatchLog(supabase, userId, {
    dispatch_id: dispatchId,
    request: parsedInput,
    dispatch: response.dispatch,
    evaluatedAccounts: evaluatedAccounts.map((item) => ({
      id: item.account.id,
      provider: item.account.provider,
      remainingQuotaBytes: item.remainingQuotaBytes,
      eligible: item.eligible,
      ineligibleReason: item.ineligibleReason ?? null,
    })),
  });

  return response;
}
