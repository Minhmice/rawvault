#!/usr/bin/env node
/**
 * Phase 9 — Download and Stream verification.
 * Deterministic checks: auth, 404, download/stream response headers and body.
 */

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
    if (!cookiePair) continue;
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) continue;
    const name = cookiePair.slice(0, separatorIndex).trim();
    const cookieValue = cookiePair.slice(separatorIndex + 1).trim();
    if (!name) continue;
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
    Accept: options.binary ? "application/octet-stream,*/*" : "application/json",
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
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
  updateCookieJar(response);
  const text = await response.text();
  let data = null;
  if (text && !options.binary) {
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
      `${method} ${path} expected HTTP ${options.expectedStatus} but received ${response.status}. Response: ${JSON.stringify(data ?? text?.slice(0, 200))}`,
    );
  }
  return { status: response.status, data, text, headers: response.headers };
}

async function main() {
  const results = [];
  const pass = (scenario) => {
    results.push({ scenario, result: "PASS" });
    console.log(`[PASS] ${scenario}`);
  };
  const fail = (scenario, reason) => {
    results.push({ scenario, result: "FAIL", reason });
    console.log(`[FAIL] ${scenario}: ${reason}`);
  };

  console.log(`\n=== Phase 9 Download/Stream Verification ===`);
  console.log(`Base URL: ${baseUrl}\n`);

  let signIn = await request("POST", "/api/auth/dev/seeded-signin", {
    headers: process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN
      ? { "x-rawvault-dev-token": process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN }
      : undefined,
  });
  if (signIn.status !== 200) {
    signIn = await request("POST", "/api/auth/signin", {
      expectedStatus: 200,
      body: {
        email: process.env.RAWVAULT_QA_EMAIL ?? "qa+slice2@rawvault.local",
        password: process.env.RAWVAULT_QA_PASSWORD ?? "RawVault123!",
      },
    });
  }
  assert(signIn.data?.success === true, "Sign-in failed.");
  await request("POST", "/api/auth/session/persist", { expectedStatus: 200 });

  const filesRes = await request("GET", "/api/files", { expectedStatus: 200 });
  const fileId = signIn.data?.fixtures?.fileId ?? filesRes.data?.files?.[0]?.id;

  if (!fileId) {
    fail("1. GET /api/files/:id/download", "No file id available (no seeded files)");
    fail("2. GET /api/files/:id/stream", "No file id available");
  } else {
    try {
      const downloadRes = await request("GET", `/api/files/${fileId}/download`, {
        expectedStatus: 200,
        binary: true,
      });
      const contentType = downloadRes.headers.get("content-type");
      const disposition = downloadRes.headers.get("content-disposition");
      assert(downloadRes.status === 200, "download status");
      assert(contentType, "content-type header");
      assert(disposition?.includes("attachment"), "content-disposition attachment");
      assert(downloadRes.text?.length > 0, "download body non-empty");
      pass("1. GET /api/files/:id/download — 200, attachment, body");
    } catch (e) {
      fail("1. GET /api/files/:id/download", e?.message ?? String(e));
    }

    try {
      const streamRes = await request("GET", `/api/files/${fileId}/stream`, {
        expectedStatus: 200,
        binary: true,
      });
      const contentType = streamRes.headers.get("content-type");
      const disposition = streamRes.headers.get("content-disposition");
      assert(streamRes.status === 200, "stream status");
      assert(contentType, "content-type header");
      assert(disposition?.includes("inline"), "content-disposition inline");
      assert(streamRes.text?.length > 0, "stream body non-empty");
      pass("2. GET /api/files/:id/stream — 200, inline, body");
    } catch (e) {
      fail("2. GET /api/files/:id/stream", e?.message ?? String(e));
    }
  }

  try {
    const unauth = await fetch(`${baseUrl}/api/files/00000000-0000-0000-0000-000000000000/download`, {
      headers: { Accept: "application/json" },
    });
    if (unauth.status === 401) {
      pass("3. Unauthorized — 401 for download without session");
    } else {
      fail("3. Unauthorized", `Expected 401, got ${unauth.status}`);
    }
  } catch (e) {
    fail("3. Unauthorized", e?.message ?? String(e));
  }

  try {
    const notFound = await request("GET", "/api/files/00000000-0000-0000-0000-000000000000/download");
    if (notFound.status === 404) {
      pass("4. Not found — 404 for non-existent file");
    } else {
      fail("4. Not found", `Expected 404, got ${notFound.status}`);
    }
  } catch (e) {
    fail("4. Not found", e?.message ?? String(e));
  }

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  console.log(`\n--- Summary ---`);
  console.log(`PASS: ${passed} | FAIL: ${failed}`);
  if (failed > 0) {
    console.error("\nPhase 9 verification FAILED.");
    process.exitCode = 1;
  } else {
    console.log("\nPhase 9 verification PASSED.");
  }
}

main().catch((error) => {
  console.error("Phase 9 verification error:", error?.message ?? error);
  process.exitCode = 1;
});
