import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";

const oauthEnvByProvider: Record<
  AccountProvider,
  {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  }
> = {
  gdrive: {
    clientId: "RAWVAULT_GDRIVE_CLIENT_ID",
    clientSecret: "RAWVAULT_GDRIVE_CLIENT_SECRET",
    callbackUrl: "RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL",
  },
  onedrive: {
    clientId: "RAWVAULT_ONEDRIVE_CLIENT_ID",
    clientSecret: "RAWVAULT_ONEDRIVE_CLIENT_SECRET",
    callbackUrl: "RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL",
  },
};

const EXPECTED_CALLBACK_PATH = "/api/storage/accounts/connect/callback";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      `Missing required environment variable: ${name}`,
    );
  }
  return value;
}

function parseAbsoluteUrl(value: string, envName: string): string {
  try {
    return new URL(value).toString();
  } catch {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      `Invalid URL in environment variable: ${envName}`,
    );
  }
}

export type OAuthProviderConfig = {
  provider: AccountProvider;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export function getOAuthProviderConfig(
  provider: AccountProvider,
  redirectUri?: string,
): OAuthProviderConfig {
  const envNames = oauthEnvByProvider[provider];
  const callbackUrl = parseAbsoluteUrl(
    requiredEnv(envNames.callbackUrl),
    envNames.callbackUrl,
  );
  const callbackPath = new URL(callbackUrl).pathname;
  if (callbackPath !== EXPECTED_CALLBACK_PATH) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      `Invalid callback path in ${envNames.callbackUrl}; expected ${EXPECTED_CALLBACK_PATH}.`,
    );
  }

  if (redirectUri && redirectUri !== callbackUrl) {
    throw new ApiError(
      400,
      "OAUTH_REDIRECT_URI_MISMATCH",
      "Redirect URI does not match the configured callback URL.",
    );
  }

  return {
    provider,
    clientId: requiredEnv(envNames.clientId),
    clientSecret: requiredEnv(envNames.clientSecret),
    callbackUrl,
  };
}

