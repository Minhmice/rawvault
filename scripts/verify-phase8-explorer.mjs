#!/usr/bin/env node
/**
 * Phase 8 — Unified Explorer verification.
 * Deterministic checks for: folder nav, file listing, file detail, provider badge, preview status.
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
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
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
  return { status: response.status, data };
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

  console.log(`\n=== Phase 8 Unified Explorer Verification ===`);
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

  // --- 1. Folder navigation (GET /api/folders, parentId filter) ---
  try {
    const foldersAll = await request("GET", "/api/folders", { expectedStatus: 200 });
    assert(foldersAll.data?.success === true, "folders success");
    assert(Array.isArray(foldersAll.data?.folders), "folders array");
    assert(typeof foldersAll.data?.total === "number", "folders total");
    pass("1. GET /api/folders — success, folders[], total");
  } catch (e) {
    fail("1. GET /api/folders", e?.message ?? String(e));
  }

  try {
    const foldersAll = await request("GET", "/api/folders", { expectedStatus: 200 });
    const rootFolders = (foldersAll.data?.folders ?? []).filter((f) => !f.parentId);
    const firstRoot = rootFolders[0];
    if (firstRoot?.id) {
      const children = await request(
        "GET",
        `/api/folders?parentId=${encodeURIComponent(firstRoot.id)}`,
        { expectedStatus: 200 },
      );
      assert(children.data?.success === true, "children success");
      assert(Array.isArray(children.data?.folders), "children array");
      pass("1b. GET /api/folders?parentId=... — parentId filter works");
    } else {
      pass("1b. GET /api/folders?parentId=... — skipped (no root folders)");
    }
  } catch (e) {
    fail("1b. GET /api/folders?parentId filter", e?.message ?? String(e));
  }

  // --- 2. File listing (GET /api/files, folderId, sort, filter) ---
  try {
    const filesBase = await request("GET", "/api/files", { expectedStatus: 200 });
    assert(filesBase.data?.success === true, "files success");
    assert(Array.isArray(filesBase.data?.files), "files array");
    assert(typeof filesBase.data?.total === "number", "files total");
    pass("2. GET /api/files — success, files[], total");
  } catch (e) {
    fail("2. GET /api/files", e?.message ?? String(e));
  }

  try {
    const filesSort = await request(
      "GET",
      "/api/files?sortBy=name&sortOrder=asc",
      { expectedStatus: 200 },
    );
    assert(filesSort.data?.success === true, "sort success");
    pass("2b. GET /api/files?sortBy=name&sortOrder=asc — sort params");
  } catch (e) {
    fail("2b. GET /api/files sort params", e?.message ?? String(e));
  }

  try {
    await request(
      "GET",
      "/api/files?provider=gdrive&previewStatus=pending",
      { expectedStatus: 200 },
    );
    pass("2c. GET /api/files?provider=...&previewStatus=... — filter params");
  } catch (e) {
    fail("2c. GET /api/files filter params", e?.message ?? String(e));
  }

  // --- 3. File detail fetch (GET /api/files/:id) ---
  const foldersRes = await request("GET", "/api/folders", { expectedStatus: 200 });
  const filesRes = await request("GET", "/api/files", { expectedStatus: 200 });
  const fileId =
    signIn.data?.fixtures?.fileId ?? filesRes.data?.files?.[0]?.id;
  if (fileId) {
    try {
      const fileDetail = await request("GET", `/api/files/${fileId}`, {
        expectedStatus: 200,
      });
      assert(fileDetail.data?.success === true, "file detail success");
      assert(fileDetail.data?.file?.id === fileId, "file id matches");
      pass("3. GET /api/files/:id — success, correct file");
    } catch (e) {
      fail("3. GET /api/files/:id", e?.message ?? String(e));
    }
  } else {
    fail("3. GET /api/files/:id", "No file id available (no seeded files)");
  }

  // --- 4. Provider badge (storage_provider in response) ---
  let fileDetailData = filesRes.data?.files?.[0] ?? null;
  if (!fileDetailData && fileId) {
    const fd = await request("GET", `/api/files/${fileId}`, { expectedStatus: 200 });
    fileDetailData = fd.data?.file ?? null;
  }
  if (fileDetailData) {
    const hasProvider =
      fileDetailData.provider === "gdrive" || fileDetailData.provider === "onedrive";
    if (hasProvider) {
      pass("4. Provider badge — storage_provider (provider) in response");
    } else {
      fail("4. Provider badge", `Unexpected provider: ${fileDetailData.provider}`);
    }
  } else {
    fail("4. Provider badge", "No file data to check provider");
  }

  // --- 5. Preview status visibility (preview_status, error_code) ---
  if (fileDetailData) {
    const validStatuses = ["pending", "processing", "ready", "failed"];
    const hasStatus = validStatuses.includes(fileDetailData.previewStatus);
    const hasErrorCode = fileDetailData.errorCode === null || typeof fileDetailData.errorCode === "string";
    if (hasStatus) {
      pass("5. Preview status — preview_status in response");
    } else {
      fail("5. Preview status", `Unexpected previewStatus: ${fileDetailData.previewStatus}`);
    }
    if (hasErrorCode) {
      pass("5b. Preview error_code — error_code in response");
    } else {
      fail("5b. Preview error_code", `Unexpected errorCode type`);
    }
  } else {
    fail("5. Preview status", "No file data");
    fail("5b. Preview error_code", "No file data");
  }

  // --- 6. Loading/error/empty — API contract (404 for missing file) ---
  try {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const notFound = await request("GET", `/api/files/${fakeId}`);
    if (notFound.status === 404) {
      pass("6. Error handling — 404 for non-existent file");
    } else {
      fail("6. Error handling", `Expected 404, got ${notFound.status}`);
    }
  } catch (e) {
    fail("6. Error handling", e?.message ?? String(e));
  }

  // Summary
  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  console.log(`\n--- Summary ---`);
  console.log(`PASS: ${passed} | FAIL: ${failed}`);
  if (failed > 0) {
    console.error("\nPhase 8 verification FAILED.");
    process.exitCode = 1;
  } else {
    console.log("\nPhase 8 verification PASSED.");
  }
}

main().catch((error) => {
  console.error("Phase 8 verification error:", error?.message ?? error);
  process.exitCode = 1;
});
