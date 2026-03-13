import {
  listAccountsResponseSchema,
  providerConnectCallbackSchema,
  providerConnectCallbackQueryParamKeys,
  providerConnectResponseSchema,
  setActiveAccountResponseSchema,
  storageAccountsErrorResponseSchema,
  unlinkAccountResponseSchema,
  type AccountProvider,
  type LinkedAccount,
  type ProviderConnectCallback,
} from "@/lib/contracts";

export type Provider = AccountProvider;
export type { LinkedAccount };

const providerConnectEntrypointPath = "/api/storage/accounts/connect";

function parseApiError(payload: unknown): string {
  const parsed = storageAccountsErrorResponseSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data.error.message;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "Request failed.";
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

function readQueryValue(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function normalizeReturnTo(returnTo?: string): string {
  if (!returnTo) {
    return "/";
  }

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }

  return returnTo;
}

export function buildProviderConnectEntrypoint(provider: Provider, returnTo?: string): string {
  const params = new URLSearchParams({
    provider,
    returnTo: normalizeReturnTo(returnTo),
  });
  return `${providerConnectEntrypointPath}?${params.toString()}`;
}

export function readProviderConnectCallback(search: string): ProviderConnectCallback | null {
  const searchInput = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(searchInput);
  const status = readQueryValue(params, providerConnectCallbackQueryParamKeys.status);

  if (!status) {
    return null;
  }

  const parsed = providerConnectCallbackSchema.safeParse({
    provider: readQueryValue(params, providerConnectCallbackQueryParamKeys.provider),
    status,
    message: readQueryValue(params, providerConnectCallbackQueryParamKeys.message),
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function stripProviderConnectCallback(search: string): string {
  const searchInput = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(searchInput);
  params.delete(providerConnectCallbackQueryParamKeys.provider);
  params.delete(providerConnectCallbackQueryParamKeys.status);
  params.delete(providerConnectCallbackQueryParamKeys.message);
  const nextQuery = params.toString();
  return nextQuery.length > 0 ? `?${nextQuery}` : "";
}

export async function startProviderConnect(
  provider: Provider,
  returnTo?: string,
): Promise<void> {
  const connectUrl = buildProviderConnectEntrypoint(provider, returnTo);

  try {
    const response = await fetch(connectUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await readPayload(response);

    if (!response.ok) {
      throw new Error(parseApiError(payload));
    }

    const connectResponse = providerConnectResponseSchema.safeParse(payload);
    if (connectResponse.success) {
      window.location.assign(connectResponse.data.authorizationUrl);
      return;
    }

    throw new Error("Invalid provider connect response.");
  } catch (error) {
    if (error instanceof TypeError) {
      window.location.assign(connectUrl);
      return;
    }

    throw error;
  }
}

export async function fetchLinkedAccounts(signal?: AbortSignal): Promise<LinkedAccount[]> {
  const response = await fetch("/api/storage/accounts", {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return listAccountsResponseSchema.parse(payload).accounts;
}

export async function unlinkProviderAccount(accountId: string): Promise<void> {
  const response = await fetch("/api/storage/accounts/unlink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ accountId, confirm: true }),
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  unlinkAccountResponseSchema.parse(payload);
}

export async function setActiveProviderAccount(accountId: string): Promise<void> {
  const response = await fetch("/api/storage/accounts/set-active", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ accountId }),
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  setActiveAccountResponseSchema.parse(payload);
}
