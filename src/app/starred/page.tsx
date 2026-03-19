import { AuthGuard } from "@/components/auth/AuthGuard";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";

export default function StarredPage() {
  return (
    <AuthGuard mode="requireAuth">
      <ComingSoonPage
        titleKey="comingSoon.titleStarred"
        descriptionKey="comingSoon.descStarred"
        backHref="/"
      />
    </AuthGuard>
  );
}
