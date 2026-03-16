import { z } from "zod";

/**
 * Foundation slice providers. Keep narrow for MVP, extend in later slices.
 */
export const accountProviderSchema = z.enum(["gdrive", "onedrive"]);
export const providerHealthStatusSchema = z.enum(["healthy", "degraded", "error"]);

/**
 * Runtime/account health state used by UI and backend workflows.
 */
export const accountStatusSchema = z.enum([
  "active",
  "inactive",
  "reauth_required",
  "error",
]);

/**
 * Quota classification for display and routing hints.
 */
export const accountQuotaStatusSchema = z.enum([
  "healthy",
  "near_limit",
  "full",
  "unknown",
]);

/**
 * App-safe token lifecycle projection. Never exposes raw tokens.
 */
export const tokenLifecycleStatusSchema = z.enum([
  "missing",
  "valid",
  "expiring_soon",
  "expired",
]);

export const linkedAccountProviderMetadataSchema = z.object({
  providerLabel: z.string().trim().min(1).max(100),
  accountIdHint: z.string().trim().min(1).max(255),
  accountEmail: z.string().email().nullable(),
  healthStatus: providerHealthStatusSchema,
});

export const linkedAccountTokenLifecycleSchema = z.object({
  status: tokenLifecycleStatusSchema,
  expiresAt: z.string().datetime().nullable(),
  refreshAvailable: z.boolean(),
});

export const linkedAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: accountProviderSchema,
  providerAccountId: z.string().min(1).max(255),
  accountEmail: z.string().email().nullable(),
  providerMetadata: linkedAccountProviderMetadataSchema,
  status: accountStatusSchema,
  quotaTotalBytes: z.coerce.number().int().nonnegative(),
  quotaUsedBytes: z.coerce.number().int().nonnegative(),
  quotaStatus: accountQuotaStatusSchema,
  isActive: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  tokenLifecycle: linkedAccountTokenLifecycleSchema,
  lastSyncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const providerConnectScaffoldSchema = z
  .object({
    providerAccountId: z.string().min(1).max(255).optional(),
    accountEmail: z.string().email().optional(),
    expiresAt: z.string().datetime().optional(),
    quotaTotalBytes: z.coerce.number().int().nonnegative().optional(),
    quotaUsedBytes: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (input) =>
      input.quotaTotalBytes === undefined ||
      input.quotaUsedBytes === undefined ||
      input.quotaUsedBytes <= input.quotaTotalBytes,
    {
      message: "quotaUsedBytes must be less than or equal to quotaTotalBytes",
      path: ["quotaUsedBytes"],
    },
  );

/**
 * Legacy link scaffolding request body used by `/api/storage/accounts/link`.
 */
export const createLinkAccountRequestSchema = z.object({
  provider: accountProviderSchema,
  redirectUri: z.string().url().optional(),
  returnTo: z.string().trim().min(1).max(2048).optional(),
  scaffold: providerConnectScaffoldSchema.optional(),
});

/**
 * Canonical response shape for legacy link scaffolding endpoint.
 */
export const createLinkAccountResponseSchema = z.object({
  success: z.literal(true),
  connect: z.object({
    step: z.enum(["oauth_redirect", "linked_account_ready"]),
    provider: accountProviderSchema,
    authorizationUrl: z.string().url().nullable(),
    state: z.string().min(1).nullable(),
  }),
  account: linkedAccountSchema.nullable(),
  alreadyLinked: z.boolean(),
});

/**
 * Canonical request shape for OAuth connect initiation endpoint.
 */
export const providerConnectRequestSchema = z.object({
  provider: accountProviderSchema,
  returnTo: z.string().trim().min(1).max(2048).optional(),
  redirectUri: z.string().url().optional(),
});

/**
 * Canonical response shape for OAuth connect initiation endpoint.
 */
export const providerConnectResponseSchema = z.object({
  success: z.literal(true),
  provider: accountProviderSchema,
  authorizationUrl: z.string().url(),
});

export const providerCallbackRequestSchema = z
  .object({
    provider: accountProviderSchema,
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    errorDescription: z.string().min(1).optional(),
    redirectUri: z.string().url().optional(),
    returnTo: z.string().trim().min(1).max(2048).optional(),
  })
  .refine((input) => Boolean(input.code || input.error), {
    message: "Either code or error is required.",
    path: ["code"],
  });

export const providerConnectCallbackQuerySchema = z
  .object({
    state: z.string().min(1),
    code: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    errorDescription: z.string().min(1).optional(),
    redirectUri: z.string().url().optional(),
  })
  .refine((input) => Boolean(input.code || input.error), {
    message: "Either code or error is required.",
    path: ["code"],
  });

/**
 * Browser callback status shape used by frontend callback messaging.
 */
export const providerConnectCallbackStatusSchema = z.enum([
  "success",
  "error",
  "cancelled",
]);

export const providerConnectCallbackQueryParamKeys = {
  provider: "storageConnectProvider",
  status: "storageConnectStatus",
  message: "storageConnectMessage",
} as const;

export const providerConnectCallbackSchema = z.object({
  provider: accountProviderSchema,
  status: providerConnectCallbackStatusSchema,
  message: z.string().trim().min(1).max(500).optional(),
});

export const providerCallbackResponseSchema = z.object({
  success: z.literal(true),
  callback: providerConnectCallbackSchema,
  account: linkedAccountSchema.nullable(),
  relinked: z.boolean(),
});

/**
 * Backward-compatible alias while link fallback endpoint still exists.
 */
export const providerLinkResponseSchema = createLinkAccountResponseSchema;

export const listAccountsResponseSchema = z.object({
  success: z.literal(true),
  accounts: z.array(linkedAccountSchema),
  total: z.number().int().nonnegative(),
});

export const unlinkAccountRequestSchema = z.object({
  accountId: z.string().uuid(),
  confirm: z.literal(true),
});

export const unlinkAccountResponseSchema = z.object({
  success: z.literal(true),
  accountId: z.string().uuid(),
  unlinked: z.literal(true),
});

export const setActiveAccountRequestSchema = z.object({
  accountId: z.string().uuid(),
});

export const setActiveAccountResponseSchema = z.object({
  success: z.literal(true),
  account: linkedAccountSchema,
});

export const setDefaultWriteAccountRequestSchema = z.object({
  accountId: z.string().uuid(),
});

export const setDefaultWriteAccountResponseSchema = z.object({
  success: z.literal(true),
});

export const setOverflowPriorityRequestSchema = z.object({
  accountId: z.string().uuid(),
  overflowPriority: z.number().int().min(0),
});

export const setOverflowPriorityResponseSchema = z.object({
  success: z.literal(true),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
    requestId: z.string().min(1).optional(),
  }),
});

export const storageAccountsErrorResponseSchema = apiErrorSchema;
export const providerConnectErrorResponseSchema = storageAccountsErrorResponseSchema;
export const providerCallbackErrorResponseSchema = storageAccountsErrorResponseSchema;

export type AccountProvider = z.infer<typeof accountProviderSchema>;
export type ProviderHealthStatus = z.infer<typeof providerHealthStatusSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AccountQuotaStatus = z.infer<typeof accountQuotaStatusSchema>;
export type TokenLifecycleStatus = z.infer<typeof tokenLifecycleStatusSchema>;
export type LinkedAccountProviderMetadata = z.infer<
  typeof linkedAccountProviderMetadataSchema
>;
export type LinkedAccountTokenLifecycle = z.infer<
  typeof linkedAccountTokenLifecycleSchema
>;
export type LinkedAccount = z.infer<typeof linkedAccountSchema>;
export type ProviderConnectRequest = z.infer<typeof providerConnectRequestSchema>;
export type ProviderConnectResponse = z.infer<typeof providerConnectResponseSchema>;
export type ProviderLinkResponse = z.infer<typeof providerLinkResponseSchema>;
export type ProviderCallbackRequest = z.infer<typeof providerCallbackRequestSchema>;
export type ProviderConnectCallbackQuery = z.infer<typeof providerConnectCallbackQuerySchema>;
export type ProviderCallbackResponse = z.infer<typeof providerCallbackResponseSchema>;
export type ProviderConnectCallbackStatus = z.infer<
  typeof providerConnectCallbackStatusSchema
>;
export type ProviderConnectCallback = z.infer<typeof providerConnectCallbackSchema>;
export type CreateLinkAccountRequest = z.infer<typeof createLinkAccountRequestSchema>;
export type CreateLinkAccountResponse = z.infer<typeof createLinkAccountResponseSchema>;
export type ListAccountsResponse = z.infer<typeof listAccountsResponseSchema>;
export type UnlinkAccountRequest = z.infer<typeof unlinkAccountRequestSchema>;
export type UnlinkAccountResponse = z.infer<typeof unlinkAccountResponseSchema>;
export type SetActiveAccountRequest = z.infer<typeof setActiveAccountRequestSchema>;
export type SetActiveAccountResponse = z.infer<typeof setActiveAccountResponseSchema>;
export type SetDefaultWriteAccountRequest = z.infer<typeof setDefaultWriteAccountRequestSchema>;
export type SetDefaultWriteAccountResponse = z.infer<typeof setDefaultWriteAccountResponseSchema>;
export type SetOverflowPriorityRequest = z.infer<typeof setOverflowPriorityRequestSchema>;
export type SetOverflowPriorityResponse = z.infer<typeof setOverflowPriorityResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type StorageAccountsErrorResponse = z.infer<
  typeof storageAccountsErrorResponseSchema
>;
