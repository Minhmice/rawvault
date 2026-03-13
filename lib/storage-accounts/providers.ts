import type { AccountProvider } from "@/lib/contracts";

export interface ProviderLinkContext {
  userId: string;
  providerAccountId: string;
}

export interface StorageProviderAdapter {
  provider: AccountProvider;
  beforeLink?(context: ProviderLinkContext): Promise<void>;
}

const noOpBeforeLink = async () => Promise.resolve();

export const storageProviderAdapters: Record<
  AccountProvider,
  StorageProviderAdapter
> = {
  gdrive: {
    provider: "gdrive",
    beforeLink: noOpBeforeLink,
  },
  onedrive: {
    provider: "onedrive",
    beforeLink: noOpBeforeLink,
  },
};
