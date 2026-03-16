import { AuthGuard } from "@/components/auth/AuthGuard";
import { VaultClient } from "@/components/workspace/VaultClient";

export default function Home() {
  return (
    <AuthGuard mode="requireAuth">
      <VaultClient />
    </AuthGuard>
  );
}
