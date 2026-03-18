import { AuthGuard } from "@/components/auth/AuthGuard";
import { SignInForm } from "@/components/auth/SignInForm";

export default function LoginPage() {
  return (
    <AuthGuard mode="requireGuest">
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <SignInForm />
      </div>
    </AuthGuard>
  );
}
