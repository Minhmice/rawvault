import { AuthGuard } from "@/components/auth/AuthGuard";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";

export default function SettingsPage() {
  return (
    <AuthGuard mode="requireAuth">
      <ComingSoonPage
        titleKey="comingSoon.titleSettings"
        descriptionKey="comingSoon.descSettings"
        backHref="/"
      />
    </AuthGuard>
  );
}
