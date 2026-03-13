import type { AccountProvider } from "@/lib/contracts";

export interface DispatchPlanContext {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface UploadDispatchProviderAdapter {
  provider: AccountProvider;
  buildExecutionHint(context: DispatchPlanContext): string;
}

function buildDispatchOnlyExecutionHint(provider: AccountProvider): string {
  return provider === "gdrive"
    ? "provider_adapter_gdrive_dispatch_only"
    : "provider_adapter_onedrive_dispatch_only";
}

export const uploadDispatchProviderAdapters: Record<
  AccountProvider,
  UploadDispatchProviderAdapter
> = {
  gdrive: {
    provider: "gdrive",
    buildExecutionHint: () => buildDispatchOnlyExecutionHint("gdrive"),
  },
  onedrive: {
    provider: "onedrive",
    buildExecutionHint: () => buildDispatchOnlyExecutionHint("onedrive"),
  },
};
