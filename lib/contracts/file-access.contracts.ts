/**
 * Phase 9: File access (download/stream) contracts.
 * Canonical request/response and error shapes for app-layer file retrieval.
 */

import { z } from "zod";

export const fileAccessErrorCodeSchema = z.enum([
  "FILE_NOT_FOUND",
  "UNAUTHORIZED",
  "ACCOUNT_NOT_FOUND",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "TOKEN_MISSING",
  "PROVIDER_RESOURCE_NOT_FOUND",
  "PROVIDER_ACCESS_FAILED",
  "INTERNAL_SERVER_ERROR",
]);

export type FileAccessErrorCode = z.infer<typeof fileAccessErrorCodeSchema>;

export const fileAccessErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: fileAccessErrorCodeSchema,
    message: z.string(),
  }),
});

export type FileAccessErrorResponse = z.infer<typeof fileAccessErrorResponseSchema>;
