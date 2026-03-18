import { describe, it, expect } from "vitest";
import { resolvePreview, classifyFileKind, PREVIEW_SIZE_CAPS } from "../file-type-resolver";

describe("classifyFileKind", () => {
  const cases: Array<[string | null, string, string]> = [
    ["image/png", "photo.png", "image"],
    ["image/jpeg", "photo.jpg", "image"],
    [null, "photo.webp", "image"],
    ["application/pdf", "doc.pdf", "pdf"],
    [null, "doc.pdf", "pdf"],
    ["audio/mpeg", "song.mp3", "audio"],
    [null, "song.mp3", "audio"],
    ["video/mp4", "clip.mp4", "video"],
    [null, "clip.mp4", "video"],
    [null, "photo.arw", "raw_embedded"],
    [null, "photo.cr2", "raw_embedded"],
    [null, "photo.nef", "raw_embedded"],
    [null, "photo.dng", "raw_embedded"],
    ["image/x-sony-arw", "photo.arw", "raw_embedded"],
    [null, "design.psd", "image"],
    [null, "vector.ai", "image"],
    [null, "scan.jxl", "image"],
    ["application/vnd.google-apps.document", "doc.gdoc", "google_redirect"],
    ["application/vnd.google-apps.spreadsheet", "sheet.gsheet", "google_redirect"],
    ["application/vnd.google-apps.presentation", "slides.gslides", "google_redirect"],
    [null, "report.docx", "office_fallback"],
    [null, "data.xlsx", "office_fallback"],
    [null, "deck.pptx", "office_fallback"],
    ["text/html", "page.html", "unsupported"],
    ["image/svg+xml", "icon.svg", "unsupported"],
    [null, "archive.zip", "unsupported"],
    [null, "script.js", "unsupported"],
  ];

  it.each(cases)("classifyFileKind(%s, %s) → %s", (mime, filename, expected) => {
    expect(classifyFileKind(mime, filename)).toBe(expected);
  });
});

describe("resolvePreview — size caps", () => {
  it("returns too_large for image over 100MB", () => {
    const result = resolvePreview("image/png", "big.png", PREVIEW_SIZE_CAPS.image + 1);
    expect(result).toEqual({ kind: "unsupported", reason: "too_large" });
  });

  it("returns image for image exactly at cap", () => {
    const result = resolvePreview("image/png", "big.png", PREVIEW_SIZE_CAPS.image);
    expect(result).toEqual({ kind: "image" });
  });

  it("returns too_large for video over 200MB", () => {
    const result = resolvePreview("video/mp4", "big.mp4", PREVIEW_SIZE_CAPS.video + 1);
    expect(result).toEqual({ kind: "unsupported", reason: "too_large" });
  });

  it("returns too_large for pdf over 50MB", () => {
    const result = resolvePreview("application/pdf", "big.pdf", PREVIEW_SIZE_CAPS.pdf + 1);
    expect(result).toEqual({ kind: "unsupported", reason: "too_large" });
  });

  it("skips size check when sizeBytes is null", () => {
    const result = resolvePreview("image/png", "unknown.png", null);
    expect(result).toEqual({ kind: "image" });
  });
});

describe("resolvePreview — split files", () => {
  it("returns split_file for split files regardless of type", () => {
    const result = resolvePreview("image/png", "photo.png", 1000, true);
    expect(result).toEqual({ kind: "unsupported", reason: "split_file" });
  });
});

describe("resolvePreview — google_redirect skips size check", () => {
  it("google workspace files are never too_large", () => {
    const result = resolvePreview(
      "application/vnd.google-apps.document",
      "doc.gdoc",
      999_999_999,
    );
    expect(result).toEqual({ kind: "google_redirect" });
  });
});
