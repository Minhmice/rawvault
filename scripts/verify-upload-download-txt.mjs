#!/usr/bin/env node
/**
 * Upload + Download verification.
 * 1. Sign in
 * 2. Upload a .txt file with random content to Drive via POST /api/uploads/execute (preferredProvider: gdrive)
 * 3. Download it via GET /api/files/:id/download and verify body matches
 *
 * Requires: account with linked Google Drive; set RAWVAULT_QA_EMAIL and RAWVAULT_QA_PASSWORD (or use dev seeded sign-in).
 * Run: node --env-file=.env.local scripts/verify-upload-download-txt.mjs
 * Node 20+ recommended (global File required for upload).
 */

if (typeof File === "undefined") {
  console.error("This script requires Node with global File (e.g. Node 20+).");
  process.exitCode = 1;
  process.exit(1);
}

const baseUrl = process.env.RAWVAULT_BASE_URL ?? "http://localhost:3000";
const cookieJar = new Map();

const UPLOAD_FORM_KEYS = {
  file: "file",
  fileName: "fileName",
  sizeBytes: "sizeBytes",
  mime: "mime",
  folderId: "folderId",
  preferredProvider: "preferredProvider",
  preferredAccountId: "preferredAccountId",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getSetCookieHeaders(response) {
  const headers = response.headers;
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function updateCookieJar(response) {
  for (const value of getSetCookieHeaders(response)) {
    const [cookiePair] = value.split(";", 1);
    if (!cookiePair) continue;
    const eq = cookiePair.indexOf("=");
    if (eq <= 0) continue;
    const name = cookiePair.slice(0, eq).trim();
    const val = cookiePair.slice(eq + 1).trim();
    if (!name) continue;
    if (val.length === 0) cookieJar.delete(name);
    else cookieJar.set(name, val);
  }
}

function cookieHeaderValue() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(method, path, options = {}) {
  const headers = {
    Accept: options.binary ? "application/octet-stream,*/*" : "application/json",
    ...(options.headers ?? {}),
  };
  const cookie = cookieHeaderValue();
  if (cookie) headers.Cookie = cookie;

  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
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
      `${method} ${path} expected ${options.expectedStatus} got ${response.status}. ${JSON.stringify(data ?? text?.slice(0, 300))}`,
    );
  }
  return { status: response.status, data, text, headers: response.headers };
}

async function main() {
  const results = [];
  const pass = (s) => {
    results.push({ scenario: s, result: "PASS" });
    console.log(`[PASS] ${s}`);
  };
  const fail = (s, reason) => {
    results.push({ scenario: s, result: "FAIL", reason });
    console.log(`[FAIL] ${s}: ${reason}`);
  };

  console.log("\n=== Upload + Download (txt to Drive) Verification ===");
  console.log(`Base URL: ${baseUrl}`);
  const useSeeded = !!process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN;
  const useQA = process.env.RAWVAULT_QA_EMAIL || process.env.RAWVAULT_QA_PASSWORD;
  console.log(`Auth: ${useSeeded ? "seeded-signin" : useQA ? "QA email/password" : "fallback qa+slice2@rawvault.local"}`);
  if (!useSeeded && !useQA) {
    console.log("[log] Tip: For upload to Drive, use an account with linked Google Drive. Set RAWVAULT_QA_EMAIL and RAWVAULT_QA_PASSWORD in .env.local or run with: RAWVAULT_QA_EMAIL=your@email.com RAWVAULT_QA_PASSWORD=yourpass npm run qa:verify-upload-download-txt\n");
  } else {
    console.log("");
  }

  // Sign in
  console.log("[log] POST /api/auth/dev/seeded-signin ...");
  let signIn = await request("POST", "/api/auth/dev/seeded-signin", {
    headers: process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN
      ? { "x-rawvault-dev-token": process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN }
      : undefined,
  });
  if (signIn.status !== 200) {
    console.log("[log] seeded-signin not 200, trying POST /api/auth/signin ...");
    signIn = await request("POST", "/api/auth/signin", {
      expectedStatus: 200,
      body: {
        email: process.env.RAWVAULT_QA_EMAIL ?? "qa+slice2@rawvault.local",
        password: process.env.RAWVAULT_QA_PASSWORD ?? "RawVault123!",
      },
    });
  } else {
    console.log("[log] seeded-signin 200 OK");
  }
  assert(signIn.data?.success === true, "Sign-in failed.");
  console.log("[log] POST /api/auth/session/persist ...");
  await request("POST", "/api/auth/session/persist", { expectedStatus: 200 });
  console.log("[log] Session persisted, cookies:", cookieJar.size, "entries");

  // Random content for the txt file
  const randomContent =
    `RawVault upload test ${Date.now()} ${Math.random().toString(36).slice(2)}\n` +
    "Line 2\nLine 3\n";
  const contentBytes = Buffer.byteLength(randomContent, "utf8");
  console.log("[log] Prepared file: test-random.txt, size:", contentBytes, "bytes, content preview:", JSON.stringify(randomContent.slice(0, 50)) + "...");

  const formData = new FormData();
  const file = new File([randomContent], "test-random.txt", { type: "text/plain" });
  formData.append(UPLOAD_FORM_KEYS.file, file);
  formData.append(UPLOAD_FORM_KEYS.fileName, "test-random.txt");
  formData.append(UPLOAD_FORM_KEYS.sizeBytes, String(contentBytes));
  formData.append(UPLOAD_FORM_KEYS.mime, "text/plain");
  formData.append(UPLOAD_FORM_KEYS.preferredProvider, "gdrive");

  let fileId;
  try {
    console.log("[log] POST /api/uploads/execute (multipart, preferredProvider=gdrive) ...");
    const uploadRes = await fetch(`${baseUrl}/api/uploads/execute`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeaderValue(),
      },
      body: formData,
    });
    updateCookieJar(uploadRes);
    const uploadText = await uploadRes.text();
    const uploadData = uploadText ? JSON.parse(uploadText) : null;

    console.log("[log] Upload response status:", uploadRes.status, "body length:", uploadText?.length ?? 0);
    if (uploadRes.status !== 201) {
      console.log("[log] Upload response body:", uploadText?.slice(0, 500) ?? "(empty)");
      const errCode = uploadData?.error?.code;
      if (errCode === "TOKEN_MISSING" || uploadData?.error?.details?.code === "REAUTH_REQUIRED") {
        console.log("[log] Tip: This account has no stored Drive token. Set RAWVAULT_QA_EMAIL and RAWVAULT_QA_PASSWORD to an account that has linked Google Drive (and completed OAuth), or in the app go to Storage accounts and link/reconnect Google Drive.");
      } else if (errCode === "NO_ELIGIBLE_ACCOUNT" && uploadData?.error?.details?.accounts?.some((a) => a.ineligibleReason === "account_token_expired")) {
        console.log("[log] Tip: Google Drive token expired. In the app, go to Storage accounts and Reconnect the account.");
      }
      fail(
        "1. POST /api/uploads/execute (upload txt to Drive)",
        `Expected 201 got ${uploadRes.status}. ${uploadText?.slice(0, 200)}`,
      );
    } else {
      assert(uploadData?.success === true, "upload success");
      assert(uploadData?.file?.id, "upload response file.id");
      assert(
        uploadData?.file?.provider === "gdrive",
        "upload response file.provider gdrive",
      );
      fileId = uploadData.file.id;
      console.log("[log] Upload success fileId:", fileId, "name:", uploadData?.file?.name, "provider:", uploadData?.file?.provider);
      pass("1. POST /api/uploads/execute — 201, file uploaded to gdrive");
    }
  } catch (e) {
    console.log("[log] Upload exception:", e?.message ?? String(e));
    fail("1. POST /api/uploads/execute (upload txt to Drive)", e?.message ?? String(e));
  }

  if (fileId) {
    try {
      console.log("[log] GET /api/files/" + fileId + "/download ...");
      const downloadRes = await request(
        "GET",
        `/api/files/${fileId}/download`,
        { expectedStatus: 200, binary: true },
      );
      const bodyLen = downloadRes.text?.length ?? 0;
      const disposition = downloadRes.headers.get("content-disposition");
      const contentType = downloadRes.headers.get("content-type");
      console.log("[log] Download status:", downloadRes.status, "body length:", bodyLen, "content-type:", contentType, "content-disposition:", disposition?.slice(0, 60) + "...");
      assert(downloadRes.text != null, "download body");
      if (downloadRes.text !== randomContent) {
        console.log("[log] Body mismatch. Expected length:", randomContent.length, "got:", downloadRes.text?.length);
        console.log("[log] Expected preview:", JSON.stringify(randomContent.slice(0, 80)));
        console.log("[log] Got preview:", JSON.stringify(downloadRes.text?.slice(0, 80)));
      }
      assert(
        downloadRes.text === randomContent,
        "download body matches uploaded content",
      );
      assert(
        disposition?.includes("attachment") && disposition?.includes("test-random"),
        "content-disposition attachment and filename",
      );
      pass("2. GET /api/files/:id/download — 200, body matches uploaded txt");
    } catch (e) {
      console.log("[log] Download exception:", e?.message ?? String(e));
      fail("2. GET /api/files/:id/download", e?.message ?? String(e));
    }
  } else {
    fail("2. GET /api/files/:id/download", "No file id (upload failed)");
  }

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  console.log("\n--- Summary ---");
  console.log(`PASS: ${passed} | FAIL: ${failed}`);
  if (failed > 0) {
    console.error("\nUpload + Download verification FAILED.");
    process.exitCode = 1;
  } else {
    console.log("\nUpload + Download verification PASSED.");
  }
}

main().catch((err) => {
  const msg = err?.message ?? String(err);
  const cause = err?.cause?.message ?? err?.cause;
  console.error("Verification error:", msg);
  if (cause) console.error("Cause:", cause);
  if (msg === "fetch failed" || (cause && String(cause).includes("ECONNREFUSED"))) {
    console.error("Tip: ensure the app is running (npm run dev) and BASE URL is correct.");
  }
  process.exitCode = 1;
});
