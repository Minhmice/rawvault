import { z } from "zod";

import { accountProviderSchema } from "./storage-account.contracts";

const sizeBytesSchema = z.coerce.number().int().nonnegative();
const mimeSchema = z.string().trim().min(1).max(255);

/**
 * Canonical FormData field names for POST /api/uploads/execute.
 * Single source of truth — route and client must use these keys.
 */
export const UPLOAD_EXECUTE_FORM_KEYS = {
  file: "file",
  fileName: "fileName",
  sizeBytes: "sizeBytes",
  mime: "mime",
  folderId: "folderId",
  preferredProvider: "preferredProvider",
  preferredAccountId: "preferredAccountId",
  /** Explorer context: upload into this provider folder. */
  accountId: "accountId",
  providerFolderId: "providerFolderId",
} as const;

/**
 * Canonical multipart input for POST /api/uploads/execute.
 * FormData fields: file (File, required), fileName, sizeBytes, mime?, folderId?, preferredProvider?, preferredAccountId?
 */
export const uploadExecuteRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  sizeBytes: sizeBytesSchema,
  mime: mimeSchema.optional(),
  folderId: z.string().uuid().optional(),
  preferredProvider: accountProviderSchema.optional(),
  preferredAccountId: z.string().uuid().optional(),
  /** When set, upload into this provider folder (unified explorer context). */
  accountId: z.string().uuid().optional(),
  providerFolderId: z.string().min(1).nullable().optional(),
});

/**
 * Normalized success response. No provider-specific leakage.
 * file: id, name, provider, storageAccountId, providerFileId, sizeBytes, createdAt, updatedAt
 */
export const uploadExecuteSuccessResponseSchema = z.object({
  success: z.literal(true),
  file: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    provider: accountProviderSchema,
    storageAccountId: z.string().uuid(),
    providerFileId: z.string().min(1),
    sizeBytes: sizeBytesSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
});

/** Canonical error codes for POST /api/uploads/execute. Single source of truth. */
export const uploadExecuteErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "AUTH_REQUIRED",
  "REAUTH_REQUIRED",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_MISSING",
  "TOKEN_DECRYPT_FAILED",
  "TOKEN_REFRESH_FAILED",
  "TOKEN_LOAD_FAILED",
  "TOKEN_PERSIST_FAILED",
  "ACCOUNT_NOT_FOUND",
  "NO_LINKED_ACCOUNTS",
  "NO_ELIGIBLE_ACCOUNT",
  "PREFERRED_ACCOUNT_NOT_FOUND",
  "PARENT_NOT_FOUND",
  "UPLOAD_DISPATCH_LOOKUP_FAILED",
  "ACTIVITY_LOG_WRITE_FAILED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_UPLOAD_FAILED",
  "PROVIDER_RESOURCE_NOT_FOUND",
  "PROVIDER_QUOTA_EXCEEDED",
  "OAUTH_TOKEN_INVALID",
  "QUOTA_FULL",
  "FILE_TOO_LARGE",
  "SIZE_MISMATCH",
  "METADATA_PERSISTENCE_FAILED",
  "INTERNAL_SERVER_ERROR",
  "UNKNOWN_ERROR",
]);

/**
 * Canonical error response for POST /api/uploads/execute.
 * ApiError shape: { error: { code, message, details? } } — code must be from uploadExecuteErrorCodeSchema.
 */
export const uploadExecuteErrorResponseSchema = z.object({
  error: z.object({
    code: uploadExecuteErrorCodeSchema,
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type UploadExecuteRequest = z.infer<typeof uploadExecuteRequestSchema>;
export type UploadExecuteSuccessResponse = z.infer<
  typeof uploadExecuteSuccessResponseSchema
>;
export type UploadExecuteErrorCode = z.infer<typeof uploadExecuteErrorCodeSchema>;
export type UploadExecuteErrorResponse = z.infer<
  typeof uploadExecuteErrorResponseSchema
>;
