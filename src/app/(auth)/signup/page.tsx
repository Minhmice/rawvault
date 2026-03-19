import { AuthGuard } from "@/components/auth/AuthGuard";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { PageShell } from "@/components/app/PageShell";

export default function SignUpPage() {
  return (
    <AuthGuard mode="requireGuest">
      <PageShell className="flex min-h-[100dvh] items-center justify-center pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <SignUpForm />
      </PageShell>
    </AuthGuard>
  );
}
