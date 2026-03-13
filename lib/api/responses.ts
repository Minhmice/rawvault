import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, isApiError } from "@/lib/api/errors";
import type { ApiError as ApiErrorEnvelope } from "@/lib/contracts";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function toContractError(error: ApiError): ApiErrorEnvelope {
  const includeDetails = process.env.NODE_ENV === "development";

  return {
    error: {
      code: error.code,
      message: error.message,
      details: includeDetails ? error.details : undefined,
    },
  };
}

export function fail(error: ApiError): NextResponse {
  return NextResponse.json(toContractError(error), { status: error.status });
}

export function handleRouteError(error: unknown): NextResponse {
  if (isApiError(error)) {
    return fail(error);
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request.",
          details:
            process.env.NODE_ENV === "development"
              ? { fields: z.flattenError(error).fieldErrors }
              : undefined,
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    },
    { status: 500 },
  );
}
