"use client";

import React from "react";
import { PreviewError } from "@/components/preview/PreviewOverlay";
import { AudioPreview } from "@/components/preview/renderers/AudioPreview";
import { GoogleRedirect } from "@/components/preview/renderers/GoogleRedirect";
import { ImagePreview } from "@/components/preview/renderers/ImagePreview";
import { OfficeFallback } from "@/components/preview/renderers/OfficeFallback";
import { PdfPreview } from "@/components/preview/renderers/PdfPreview";
import { RawPreview } from "@/components/preview/renderers/RawPreview";
import { VideoPreview } from "@/components/preview/renderers/VideoPreview";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";

type PreviewRouterProps = {
  model: PreviewModel;
  onDownload?: () => void;
};

export function PreviewRouter({ model, onDownload }: PreviewRouterProps) {
  switch (model.kind) {
    case "image":
      return <ImagePreview model={model} />;
    case "pdf":
      return <PdfPreview model={model} />;
    case "raw_embedded":
      return <RawPreview model={model} />;
    case "audio":
      return <AudioPreview model={model} />;
    case "video":
      return <VideoPreview model={model} />;
    case "google_redirect":
      return <GoogleRedirect model={model} />;
    case "office_fallback":
      return <OfficeFallback model={model} onDownload={onDownload} />;
    case "unsupported":
    default:
      return (
        <PreviewError
          title="Preview not available"
          description={
            model.unsupportedReason === "too_large"
              ? "This file is too large to preview in-app."
              : model.unsupportedReason === "split_file"
                ? "Split files cannot be previewed."
                : model.unsupportedReason === "html_svg_blocked"
                  ? "HTML and SVG files are not previewed for security reasons."
                  : "This file type is not supported for in-app preview."
          }
        />
      );
  }
}
