import { AuthGuard } from "@/components/auth/AuthGuard";
import { SharedClient } from "@/components/workspace/SharedClient";

export default function SharedPage() {
  return (
    <AuthGuard mode="requireAuth">
      <SharedClient />
    </AuthGuard>
  );
}
