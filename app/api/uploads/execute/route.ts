import { ApiError, isApiError } from "@/lib/api/errors";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  accountProviderSchema,
  UPLOAD_EXECUTE_FORM_KEYS,
  uploadExecuteErrorCodeSchema,
  uploadExecuteRequestSchema,
  type UploadExecuteRequest,
} from "@/lib/contracts";
import { executeUpload } from "@/lib/uploads/execute.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function parseFormValue(
  formData: FormData,
  key: string,
): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Content-Type must be multipart/form-data for file upload.",
      );
    }

    const formData = await request.formData();
    const file = formData.get(UPLOAD_EXECUTE_FORM_KEYS.file);
    if (!file || !(file instanceof File)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Missing or invalid file part.");
    }

    const fileName =
      parseFormValue(formData, UPLOAD_EXECUTE_FORM_KEYS.fileName) ?? file.name ?? "";
    const sizeBytesRaw = parseFormValue(formData, UPLOAD_EXECUTE_FORM_KEYS.sizeBytes);
    const sizeBytes =
      sizeBytesRaw != null && /^\d+$/.test(sizeBytesRaw)
        ? Number.parseInt(sizeBytesRaw, 10)
        : file.size;
    const mime = parseFormValue(formData, UPLOAD_EXECUTE_FORM_KEYS.mime);
    const folderIdRaw = parseFormValue(formData, UPLOAD_EXECUTE_FORM_KEYS.folderId);
    const preferredProvider = parseFormValue(
      formData,
      UPLOAD_EXECUTE_FORM_KEYS.preferredProvider,
    );
    const preferredAccountId = parseFormValue(
      formData,
      UPLOAD_EXECUTE_FORM_KEYS.preferredAccountId,
    );

    const parsedProvider = accountProviderSchema.safeParse(preferredProvider);
    const executeRequest: UploadExecuteRequest = uploadExecuteRequestSchema.parse({
      fileName: fileName.trim() || "unnamed",
      sizeBytes,
      mime: mime?.trim() || undefined,
      folderId: folderIdRaw?.trim() || undefined,
      preferredProvider: parsedProvider.success ? parsedProvider.data : undefined,
      preferredAccountId: preferredAccountId?.trim() || undefined,
    });

    const body = await file.arrayBuffer();
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await executeUpload(
      supabase,
      user.id,
      executeRequest,
      body,
    );
    return ok(response, 201);
  } catch (error) {
    const normalized =
      isApiError(error) &&
      !uploadExecuteErrorCodeSchema.safeParse(error.code).success
        ? new ApiError(
            error.status,
            "UNKNOWN_ERROR",
            error.message,
            process.env.NODE_ENV === "development" ? { originalCode: error.code } : undefined,
          )
        : error;
    return handleRouteError(normalized);
  }
}
