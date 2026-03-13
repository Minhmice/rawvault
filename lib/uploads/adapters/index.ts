import type { AccountProvider } from "@/lib/contracts";

import type { ProviderUploadInput, ProviderUploadResult } from "./gdrive.upload";
import { uploadToGoogleDrive } from "./gdrive.upload";
import { uploadToOneDrive } from "./onedrive.upload";

export type { ProviderUploadInput, ProviderUploadResult };

export const providerUploadAdapters: Record<
  AccountProvider,
  (input: ProviderUploadInput) => Promise<ProviderUploadResult>
> = {
  gdrive: uploadToGoogleDrive,
  onedrive: uploadToOneDrive,
};
