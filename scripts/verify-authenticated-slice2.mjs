#!/usr/bin/env node

const baseUrl = process.env.RAWVAULT_BASE_URL ?? "http://localhost:3000";
const cookieJar = new Map();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSetCookieHeaders(response) {
  const headers = response.headers;
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function updateCookieJar(response) {
  const setCookieValues = getSetCookieHeaders(response);
  for (const value of setCookieValues) {
    const [cookiePair] = value.split(";", 1);
    if (!cookiePair) {
      continue;
    }

    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookiePair.slice(0, separatorIndex).trim();
    const cookieValue = cookiePair.slice(separatorIndex + 1).trim();
    if (!name) {
      continue;
    }

    if (cookieValue.length === 0) {
      cookieJar.delete(name);
    } else {
      cookieJar.set(name, cookieValue);
    }
  }
}

function cookieHeaderValue() {
  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(method, path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  const cookieHeader = cookieHeaderValue();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  let body;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body,
  });

  updateCookieJar(response);

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (
    typeof options.expectedStatus === "number" &&
    response.status !== options.expectedStatus
  ) {
    throw new Error(
      `${method} ${path} expected HTTP ${options.expectedStatus} but received ${response.status}. Response: ${JSON.stringify(data)}`,
    );
  }

  return {
    status: response.status,
    data,
  };
}

async function main() {
  console.log(`Running deterministic slice-2 auth verification against ${baseUrl}`);

  const qaEmail =
    process.env.RAWVAULT_QA_EMAIL ??
    process.env.RAWVAULT_SEED_USER_EMAIL ??
    "qa+slice2@rawvault.local";
  const qaPassword =
    process.env.RAWVAULT_QA_PASSWORD ??
    process.env.RAWVAULT_SEED_USER_PASSWORD ??
    "RawVault123!";
  const devSeededToken = process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN;
  const allowSignInFallback = process.env.RAWVAULT_QA_ALLOW_SIGNIN_FALLBACK === "true";

  let signIn = await request("POST", "/api/auth/dev/seeded-signin", {
    headers: devSeededToken ? { "x-rawvault-dev-token": devSeededToken } : undefined,
  });
  let signInMode = "seeded-helper";
  if (signIn.status !== 200) {
    if (!allowSignInFallback) {
      throw new Error(
        `Dev seeded sign-in failed with status ${signIn.status}. Set RAWVAULT_QA_ALLOW_SIGNIN_FALLBACK=true to allow /api/auth/signin fallback for debugging. Response: ${JSON.stringify(signIn.data)}`,
      );
    }

    signIn = await request("POST", "/api/auth/signin", {
      expectedStatus: 200,
      body: {
        email: qaEmail,
        password: qaPassword,
      },
    });
    signInMode = "credentials-fallback";
  }

  assert(signIn.data?.success === true, "Sign-in did not return success=true.");
  assert(signIn.data?.user?.id, "Sign-in did not return user.id.");
  console.log(`- signed in as ${signIn.data.user.email ?? signIn.data.user.id} (${signInMode})`);

  const persisted = await request("POST", "/api/auth/session/persist", {
    expectedStatus: 200,
  });
  assert(
    persisted.data?.session?.userId,
    "Session persistence helper did not return an active session.",
  );
  console.log("- session persisted");

  const folders = await request("GET", "/api/folders", { expectedStatus: 200 });
  assert(folders.data?.success === true, "GET /api/folders did not return success=true.");
  console.log(`- /api/folders total=${folders.data.total}`);

  const files = await request("GET", "/api/files", { expectedStatus: 200 });
  assert(files.data?.success === true, "GET /api/files did not return success=true.");
  console.log(`- /api/files total=${files.data.total}`);

  const fileId = signIn.data?.fixtures?.fileId ?? files.data?.files?.[0]?.id;
  assert(typeof fileId === "string" && fileId.length > 0, "No file id available for /api/files/:id check.");
  const fileDetailTarget = fileId;
  const fileDetail = await request("GET", `/api/files/${fileDetailTarget}`, {
    expectedStatus: 200,
  });
  assert(fileDetail.data?.success === true, "GET /api/files/:id did not return success=true.");
  console.log(`- /api/files/${fileDetailTarget} status=${fileDetail.status}`);

  const dispatch = await request("POST", "/api/uploads/dispatch", {
    expectedStatus: 200,
    body: {
      fileName: "seeded-auth-dispatch-check.txt",
      sizeBytes: 4096,
      mime: "text/plain",
    },
  });
  assert(
    dispatch.data?.success === true,
    "POST /api/uploads/dispatch did not return success=true.",
  );
  console.log(`- /api/uploads/dispatch status=${dispatch.status}`);

  const signOut = await request("POST", "/api/auth/signout", { expectedStatus: 200 });
  assert(signOut.data?.success === true, "Sign-out did not return success=true.");

  const currentUser = await request("GET", "/api/auth/user", { expectedStatus: 200 });
  assert(currentUser.data?.user === null, "Expected current user to be null after sign-out.");
  console.log("- sign-out verified");

  console.log("Deterministic authenticated slice-2 verification passed.");
}

main().catch((error) => {
  console.error("Deterministic authenticated slice-2 verification failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
