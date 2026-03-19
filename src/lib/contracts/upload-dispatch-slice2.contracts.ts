import { z } from "zod";

import { accountProviderSchema } from "./storage-account.contracts";

const sizeBytesSchema = z.coerce.number().int().nonnegative();
const mimeSchema = z.string().trim().min(1).max(255);

export const routingReasonSchema = z.enum([
  "quota_first_highest_remaining",
  "preferred_provider_quota_first",
  "preferred_provider_unavailable_fallback_quota_first",
  "preferred_account_override",
  "preferred_account_unavailable_fallback_quota_first",
  "active_account_unknown_quota_fallback",
]);

export const uploadDispatchRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  sizeBytes: sizeBytesSchema,
  mime: mimeSchema.optional(),
  folderId: z.string().uuid().optional(),
  preferredProvider: accountProviderSchema.optional(),
  preferredAccountId: z.string().uuid().optional(),
});

export const uploadDispatchPlanSchema = z.object({
  providerRoute: z.enum(["gdrive.upload", "onedrive.upload"]),
  executionMode: z.literal("dispatch_only"),
});

export const uploadDispatchDecisionSchema = z.object({
  provider: accountProviderSchema,
  storageAccountId: z.string().uuid(),
  reason: routingReasonSchema,
  remainingQuotaBytes: sizeBytesSchema.nullable(),
  triedAccountIds: z.array(z.string().uuid()),
  plan: uploadDispatchPlanSchema,
});

export const uploadDispatchResponseSchema = z.object({
  success: z.literal(true),
  dispatch: uploadDispatchDecisionSchema,
});

export const dispatchPreviewRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  sizeBytes: sizeBytesSchema,
  mime: mimeSchema.optional(),
  preferredProvider: accountProviderSchema.optional(),
  preferredAccountId: z.string().uuid().optional(),
});

export const dispatchCandidateSchema = z.object({
  accountId: z.string().uuid(),
  provider: accountProviderSchema,
  accountEmail: z.string().email(),
  quotaRemainingBytes: sizeBytesSchema,
  isActive: z.boolean(),
  healthStatus: z.enum(["healthy", "degraded", "error"]),
  eligible: z.boolean(),
});

export const dispatchDecisionSchema = z.object({
  provider: accountProviderSchema.nullable(),
  accountId: z.string().uuid().nullable(),
  accountEmail: z.string().email().nullable(),
  canDispatch: z.boolean(),
  routingReason: z.string().min(1),
  estimatedRemainingBytes: z.coerce.number().int().nonnegative().nullable(),
});

export const dispatchPreviewResponseSchema = z.object({
  success: z.literal(true),
  decision: dispatchDecisionSchema,
  candidates: z.array(dispatchCandidateSchema),
});

export type RoutingReason = z.infer<typeof routingReasonSchema>;
export type UploadDispatchRequest = z.infer<typeof uploadDispatchRequestSchema>;
export type UploadDispatchPlan = z.infer<typeof uploadDispatchPlanSchema>;
export type UploadDispatchDecision = z.infer<typeof uploadDispatchDecisionSchema>;
export type UploadDispatchResponse = z.infer<typeof uploadDispatchResponseSchema>;
export type DispatchPreviewRequest = z.infer<typeof dispatchPreviewRequestSchema>;
export type DispatchCandidate = z.infer<typeof dispatchCandidateSchema>;
export type DispatchDecision = z.infer<typeof dispatchDecisionSchema>;
export type DispatchPreviewResponse = z.infer<typeof dispatchPreviewResponseSchema>;
