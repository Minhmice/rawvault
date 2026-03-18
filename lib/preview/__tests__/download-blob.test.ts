import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadToBlob, buildStreamUrl, buildDownloadUrl } from "../download-blob";

describe("buildStreamUrl", () => {
  it("returns correct stream URL", () => {
    expect(buildStreamUrl("abc-123")).toBe("/api/files/abc-123/stream");
  });
});

describe("buildDownloadUrl", () => {
  it("returns correct download URL", () => {
    expect(buildDownloadUrl("abc-123")).toBe("/api/files/abc-123/download");
  });
});

describe("downloadToBlob", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok:true with blob on success", async () => {
    const mockBlob = new Blob(["hello"], { type: "text/plain" });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/plain" }),
      blob: () => Promise.resolve(mockBlob),
      body: null,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await downloadToBlob("/test-url");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe("text/plain");
      expect(result.blob).toBe(mockBlob);
    }
  });

  it("returns ok:false with http_error on non-200", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: new Headers(),
      blob: () => Promise.resolve(new Blob()),
      body: null,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await downloadToBlob("/test-url");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("http_error");
      expect(result.status).toBe(404);
    }
  });

  it("returns ok:false with aborted when signal is aborted", async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockRejectedValue(
      Object.assign(new Error("AbortError"), { name: "AbortError" }),
    );
    vi.stubGlobal("fetch", mockFetch);

    controller.abort();
    const result = await downloadToBlob("/test-url", { signal: controller.signal });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("aborted");
    }
  });

  it("returns ok:false with network_error on fetch failure", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await downloadToBlob("/test-url");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("network_error");
    }
  });
});
