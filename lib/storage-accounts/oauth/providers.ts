import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import type { OAuthProviderConfig } from "@/lib/storage-accounts/oauth/config";

type ProviderTokenResult = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
};

type ProviderIdentity = {
  providerAccountId: string;
  accountEmail: string | null;
  quotaTotalBytes?: number;
  quotaUsedBytes?: number;
  providerMetadata: Record<string, unknown>;
};

export interface OAuthProviderAdapter {
  provider: AccountProvider;
  buildAuthorizationUrl(config: OAuthProviderConfig, state: string): string;
  exchangeCodeForToken(config: OAuthProviderConfig, code: string): Promise<ProviderTokenResult>;
  refreshAccessToken(
    config: OAuthProviderConfig,
    refreshToken: string,
  ): Promise<ProviderTokenResult>;
  fetchIdentity(accessToken: string): Promise<ProviderIdentity>;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return undefined;
}

function toExpiresAt(expiresIn: unknown): string | null {
  const seconds = parsePositiveInt(expiresIn);
  if (!seconds || seconds <= 0) {
    return null;
  }
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractProviderError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.error_description === "string") {
    return record.error_description;
  }
  if (typeof record.error === "string") {
    return record.error;
  }
  if (typeof record.message === "string") {
    return record.message;
  }
  return null;
}

async function ensureProviderResponse(
  response: Response,
  provider: AccountProvider,
  stage: "token" | "identity",
): Promise<unknown> {
  const payload = await parseJsonResponse(response);
  if (response.ok) {
    return payload;
  }

  const providerMessage = extractProviderError(payload) ?? `${provider} ${stage} call failed`;
  const status = response.status >= 400 && response.status < 500 ? 400 : 502;
  const code =
    stage === "token"
      ? "OAUTH_TOKEN_EXCHANGE_FAILED"
      : "OAUTH_PROVIDER_METADATA_FETCH_FAILED";

  throw new ApiError(status, code, `Failed during ${provider} OAuth ${stage} step.`, {
    provider,
    stage,
    providerMessage,
  });
}

const googleDriveOAuthAdapter: OAuthProviderAdapter = {
  provider: "gdrive",

  buildAuthorizationUrl(config, state) {
    const query = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
  },

  async exchangeCodeForToken(config, code) {
    const body = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await ensureProviderResponse(response, "gdrive", "token");
    const record = (payload ?? {}) as Record<string, unknown>;

    if (typeof record.access_token !== "string" || record.access_token.length === 0) {
      throw new ApiError(
        502,
        "OAUTH_TOKEN_EXCHANGE_FAILED",
        "Google Drive token response did not include an access token.",
      );
    }

    return {
      accessToken: record.access_token,
      refreshToken:
        typeof record.refresh_token === "string" && record.refresh_token.length > 0
          ? record.refresh_token
          : null,
      expiresAt: toExpiresAt(record.expires_in),
      refreshTokenExpiresAt: toExpiresAt(record.refresh_token_expires_in),
    };
  },

  async refreshAccessToken(config, refreshToken) {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await ensureProviderResponse(response, "gdrive", "token");
    const record = (payload ?? {}) as Record<string, unknown>;

    if (typeof record.access_token !== "string" || record.access_token.length === 0) {
      throw new ApiError(
        502,
        "OAUTH_TOKEN_REFRESH_FAILED",
        "Google Drive refresh did not return an access token.",
      );
    }

    return {
      accessToken: record.access_token,
      refreshToken:
        typeof record.refresh_token === "string" && record.refresh_token.length > 0
          ? record.refresh_token
          : refreshToken,
      expiresAt: toExpiresAt(record.expires_in),
      refreshTokenExpiresAt: toExpiresAt(record.refresh_token_expires_in),
    };
  },

  async fetchIdentity(accessToken) {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user,storageQuota",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const payload = await ensureProviderResponse(response, "gdrive", "identity");
    const record = (payload ?? {}) as Record<string, unknown>;
    const user = (record.user ?? {}) as Record<string, unknown>;
    const quota = (record.storageQuota ?? {}) as Record<string, unknown>;

    const accountEmail =
      typeof user.emailAddress === "string" && user.emailAddress.includes("@")
        ? user.emailAddress
        : null;
    const providerAccountId =
      typeof user.permissionId === "string" && user.permissionId.length > 0
        ? user.permissionId
        : accountEmail;
    if (!providerAccountId) {
      throw new ApiError(
        502,
        "OAUTH_PROVIDER_METADATA_FETCH_FAILED",
        "Google Drive identity response did not include a stable account identifier.",
      );
    }

    return {
      providerAccountId,
      accountEmail,
      quotaTotalBytes: parsePositiveInt(quota.limit),
      quotaUsedBytes: parsePositiveInt(quota.usage),
      providerMetadata: {
        permissionId:
          typeof user.permissionId === "string" && user.permissionId.length > 0
            ? user.permissionId
            : null,
        displayName:
          typeof user.displayName === "string" && user.displayName.length > 0
            ? user.displayName
            : null,
        email: accountEmail,
      },
    };
  },
};

const oneDriveOAuthAdapter: OAuthProviderAdapter = {
  provider: "onedrive",

  buildAuthorizationUrl(config, state) {
    const query = new URLSearchParams({
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: config.callbackUrl,
      response_mode: "query",
      scope: ["offline_access", "Files.ReadWrite", "User.Read"].join(" "),
      state,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${query.toString()}`;
  },

  async exchangeCodeForToken(config, code) {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
      scope: ["offline_access", "Files.ReadWrite", "User.Read"].join(" "),
    });

    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = await ensureProviderResponse(response, "onedrive", "token");
    const record = (payload ?? {}) as Record<string, unknown>;

    if (typeof record.access_token !== "string" || record.access_token.length === 0) {
      throw new ApiError(
        502,
        "OAUTH_TOKEN_EXCHANGE_FAILED",
        "OneDrive token response did not include an access token.",
      );
    }

    return {
      accessToken: record.access_token,
      refreshToken:
        typeof record.refresh_token === "string" && record.refresh_token.length > 0
          ? record.refresh_token
          : null,
      expiresAt: toExpiresAt(record.expires_in),
      refreshTokenExpiresAt: toExpiresAt(record.refresh_token_expires_in),
    };
  },

  async refreshAccessToken(config, refreshToken) {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: ["offline_access", "Files.ReadWrite", "User.Read"].join(" "),
    });

    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );

    const payload = await ensureProviderResponse(response, "onedrive", "token");
    const record = (payload ?? {}) as Record<string, unknown>;

    if (typeof record.access_token !== "string" || record.access_token.length === 0) {
      throw new ApiError(
        502,
        "OAUTH_TOKEN_REFRESH_FAILED",
        "OneDrive refresh did not return an access token.",
      );
    }

    return {
      accessToken: record.access_token,
      refreshToken:
        typeof record.refresh_token === "string" && record.refresh_token.length > 0
          ? record.refresh_token
          : refreshToken,
      expiresAt: toExpiresAt(record.expires_in),
      refreshTokenExpiresAt: toExpiresAt(record.refresh_token_expires_in),
    };
  },

  async fetchIdentity(accessToken) {
    const meResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const mePayload = await ensureProviderResponse(meResponse, "onedrive", "identity");
    const meRecord = (mePayload ?? {}) as Record<string, unknown>;

    const accountEmail =
      typeof meRecord.mail === "string" && meRecord.mail.includes("@")
        ? meRecord.mail
        : typeof meRecord.userPrincipalName === "string" &&
            meRecord.userPrincipalName.includes("@")
          ? meRecord.userPrincipalName
        : null;
    const providerAccountId =
      typeof meRecord.id === "string" && meRecord.id.length > 0
        ? meRecord.id
        : accountEmail;
    if (!providerAccountId) {
      throw new ApiError(
        502,
        "OAUTH_PROVIDER_METADATA_FETCH_FAILED",
        "OneDrive identity response did not include a stable account identifier.",
      );
    }

    const driveResponse = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=quota", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let quotaTotalBytes: number | undefined;
    let quotaUsedBytes: number | undefined;

    if (driveResponse.ok) {
      const drivePayload = await parseJsonResponse(driveResponse);
      const driveRecord = (drivePayload ?? {}) as Record<string, unknown>;
      const quota = (driveRecord.quota ?? {}) as Record<string, unknown>;
      quotaTotalBytes = parsePositiveInt(quota.total);
      quotaUsedBytes = parsePositiveInt(quota.used);
    }

    return {
      providerAccountId,
      accountEmail,
      quotaTotalBytes,
      quotaUsedBytes,
      providerMetadata: {
        accountObjectId:
          typeof meRecord.id === "string" && meRecord.id.length > 0 ? meRecord.id : null,
        userPrincipalName:
          typeof meRecord.userPrincipalName === "string" &&
          meRecord.userPrincipalName.length > 0
            ? meRecord.userPrincipalName
            : null,
        email: accountEmail,
      },
    };
  },
};

export const storageOAuthProviderAdapters: Record<AccountProvider, OAuthProviderAdapter> = {
  gdrive: googleDriveOAuthAdapter,
  onedrive: oneDriveOAuthAdapter,
};

