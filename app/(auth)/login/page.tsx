import { AuthGuard } from "@/components/auth/AuthGuard";
import { SignInForm } from "@/components/auth/SignInForm";

export default function LoginPage() {
  return (
    <AuthGuard mode="requireGuest">
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <SignInForm />
      </div>
    </AuthGuard>
  );
}
