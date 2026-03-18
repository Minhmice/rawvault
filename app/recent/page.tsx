import { AuthGuard } from "@/components/auth/AuthGuard";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";

export default function RecentPage() {
  return (
    <AuthGuard mode="requireAuth">
      <ComingSoonPage
        titleKey="comingSoon.titleRecent"
        descriptionKey="comingSoon.descRecent"
        backHref="/"
      />
    </AuthGuard>
  );
}
