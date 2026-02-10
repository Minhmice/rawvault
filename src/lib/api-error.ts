/**
 * Stable error schema per api-patterns skill.
 * { error: { code: string, message: string, details?: unknown } }
 */

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiError(
  code: string,
  message: string,
  details?: unknown
): ApiErrorBody {
  return { error: { code, message, details } };
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  return Response.json(apiError(code, message, details), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const ErrorCodes = {
  UNAUTHORIZED: "unauthorized",
  VALIDATION: "validation_error",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  RATE_LIMITED: "rate_limited",
  INTERNAL: "internal_error",
} as const;
