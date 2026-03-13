import { Badge } from "../ui/badge";
import type { Provider } from "./contracts";

type ProviderBadgeProps = {
  provider: Provider;
};

const providerLabelMap: Record<Provider, string> = {
  gdrive: "Google Drive",
  onedrive: "OneDrive",
};

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  return <Badge>{providerLabelMap[provider]}</Badge>;
}
