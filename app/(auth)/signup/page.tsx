import { AuthGuard } from "@/components/auth/AuthGuard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthGuard mode="requireGuest">
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <SignUpForm />
      </div>
    </AuthGuard>
  );
}
