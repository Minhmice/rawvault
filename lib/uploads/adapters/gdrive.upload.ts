import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";

export type ProviderUploadInput = {
  accessToken: string;
  fileName: string;
  mime: string | null;
  body: ArrayBuffer | Buffer;
  sizeBytes: number;
  parentFolderId?: string | null;
};

export type ProviderUploadResult = {
  provider: AccountProvider;
  providerFileId: string;
  providerMetadata?: Record<string, unknown>;
};

function extractDriveError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error;
  if (err && typeof err === "object" && typeof (err as Record<string, unknown>).message === "string") {
    return (err as Record<string, string>).message;
  }
  if (typeof r.message === "string") return r.message;
  return null;
}

function buildMultipartBody(
  boundary: string,
  fileName: string,
  mime: string,
  body: Buffer,
  parentFolderId?: string | null,
): Buffer {
  const metadata: Record<string, unknown> = { name: fileName };
  if (parentFolderId && parentFolderId.trim().length > 0) {
    metadata.parents = [parentFolderId.trim()];
  }
  const metaPart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      "\r\n",
    "utf-8",
  );
  const filePart = Buffer.from(
    `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
    "utf-8",
  );
  const endPart = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
  return Buffer.concat([metaPart, filePart, body, endPart]);
}

export async function uploadToGoogleDrive(
  input: ProviderUploadInput,
): Promise<ProviderUploadResult> {
  const url = new URL("https://www.googleapis.com/upload/drive/v3/files");
  url.searchParams.set("uploadType", "multipart");

  const body =
    input.body instanceof ArrayBuffer ? Buffer.from(input.body) : input.body;
  const mime = input.mime ?? "application/octet-stream";
  const boundary = "rv_upload_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
  const multipart = buildMultipartBody(
    boundary,
    input.fileName,
    mime,
    body,
    input.parentFolderId,
  );

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(multipart.length),
    },
    body: new Uint8Array(multipart),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = extractDriveError(payload) ?? "Google Drive upload failed";
    const status = response.status;
    const code =
      status === 401 || status === 403
        ? "OAUTH_TOKEN_INVALID"
        : status === 404
          ? "PROVIDER_RESOURCE_NOT_FOUND"
          : status === 507
            ? "PROVIDER_QUOTA_EXCEEDED"
            : "PROVIDER_UPLOAD_FAILED";
    throw new ApiError(
      status >= 400 && status < 500 ? 400 : 502,
      code,
      msg,
      { provider: "gdrive" },
    );
  }

  const record = (payload ?? {}) as Record<string, unknown>;
  const fileId = typeof record.id === "string" ? record.id : null;

  if (!fileId) {
    throw new ApiError(
      502,
      "PROVIDER_UPLOAD_FAILED",
      "Google Drive did not return a file id.",
      { provider: "gdrive" },
    );
  }

  return {
    provider: "gdrive",
    providerFileId: fileId,
    providerMetadata: {
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
    },
  };
}
