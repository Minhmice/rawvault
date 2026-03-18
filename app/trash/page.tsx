import { AuthGuard } from "@/components/auth/AuthGuard";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";

export default function TrashPage() {
  return (
    <AuthGuard mode="requireAuth">
      <ComingSoonPage
        titleKey="comingSoon.titleTrash"
        descriptionKey="comingSoon.descTrash"
        backHref="/"
      />
    </AuthGuard>
  );
}
