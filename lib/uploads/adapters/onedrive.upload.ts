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

function extractGraphError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (typeof r.message === "string") return r.message;
  return null;
}

export async function uploadToOneDrive(
  input: ProviderUploadInput,
): Promise<ProviderUploadResult> {
  const encodedName = encodeURIComponent(input.fileName);
  const path = input.parentFolderId
    ? `/me/drive/items/${input.parentFolderId}:/${encodedName}:/content`
    : `/me/drive/root:/${encodedName}:/content`;

  const url = `https://graph.microsoft.com/v1.0${path}`;
  const body =
    input.body instanceof ArrayBuffer ? Buffer.from(input.body) : input.body;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": input.mime ?? "application/octet-stream",
      "Content-Length": String(input.sizeBytes),
    },
    body: new Uint8Array(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = extractGraphError(payload) ?? "OneDrive upload failed";
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
      { provider: "onedrive" },
    );
  }

  const record = (payload ?? {}) as Record<string, unknown>;
  const fileId = typeof record.id === "string" ? record.id : null;

  if (!fileId) {
    throw new ApiError(
      502,
      "PROVIDER_UPLOAD_FAILED",
      "OneDrive did not return a file id.",
      { provider: "onedrive" },
    );
  }

  return {
    provider: "onedrive",
    providerFileId: fileId,
    providerMetadata: {
      id: record.id,
      name: record.name,
    },
  };
}
