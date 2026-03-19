import { handleRouteError, ok } from "@/lib/api/responses";
import {
  driveImportFolderRequestSchema,
  driveImportFileRequestSchema,
} from "@/lib/contracts/drive-import.contracts";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  importFolderFromDrive,
  importFileFromDrive,
} from "@/lib/storage-accounts/import.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    if (raw === null) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
    }
    if (typeof raw !== "object" || Array.isArray(raw) || !("type" in raw)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request must include type: 'folder' or 'file'.");
    }

    const type = (raw as { type?: string }).type;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    if (type === "folder") {
      const parsed = driveImportFolderRequestSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid folder import request.", {
          fields: parsed.error.flatten().fieldErrors,
        });
      }
      const result = await importFolderFromDrive(supabase, user.id, parsed.data);
      return ok(result, 201);
    }

    if (type === "file") {
      const parsed = driveImportFileRequestSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid file import request.", {
          fields: parsed.error.flatten().fieldErrors,
        });
      }
      const result = await importFileFromDrive(supabase, user.id, parsed.data);
      return ok(result, 201);
    }

    throw new ApiError(400, "VALIDATION_ERROR", "type must be 'folder' or 'file'.");
  } catch (error) {
    return handleRouteError(error);
  }
}
