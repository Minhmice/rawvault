import { AuthGuard } from "@/components/auth/AuthGuard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthGuard mode="requireGuest">
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <SignUpForm />
      </div>
    </AuthGuard>
  );
}
