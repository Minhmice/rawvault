"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "@/components/themes";

type ApiErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown };
};

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof (error.error as { message?: unknown }).message === "string"
  ) {
    return (error.error as { message: string }).message;
  }
  return fallback;
}

export function SignUpForm() {
  const router = useRouter();
  const { t } = useLocale();
  const { ThemeButton, ThemeCard, ThemeInput } = useThemeComponents();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth.pleaseEnterEmail"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("auth.validEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = (await res.json().catch(() => null)) as
        | ApiErrorEnvelope
        | { success?: boolean; emailConfirmationRequired?: boolean };

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object"
            ? (data.error as { message?: string }).message ?? t("auth.signUpFailed")
            : t("auth.signUpFailed");
        setError(msg);
        return;
      }

      const success = data && typeof data === "object" && "success" in data && data.success === true;
      const emailConfirm =
        data && typeof data === "object" && "emailConfirmationRequired" in data && data.emailConfirmationRequired;

      if (success && !emailConfirm) {
        router.push("/");
        router.refresh();
        return;
      }

      if (success && emailConfirm) {
        setError(null);
        router.push("/login?message=" + encodeURIComponent(t("auth.checkEmailConfirm")) + "&success=1");
        router.refresh();
        return;
      }

      setError(t("auth.signUpCompletedSignIn"));
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(formatErrorMessage(err, t("auth.signUpFailedTryAgain")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeCard className="animate-enter w-full max-w-md cursor-default border border-border bg-card p-6 shadow-sm hover:translate-y-0 hover:scale-100">
      <h1 className="text-2xl font-heading font-bold uppercase tracking-widest text-foreground">
        RawVault
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("auth.createAccount")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("auth.email")}
          </label>
          <ThemeInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("auth.password")}
          </label>
          <ThemeInput
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("auth.atLeast8Chars")}</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("auth.confirmPassword")}
          </label>
          <ThemeInput
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>

        {error ? (
          <div className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <ThemeButton
          type="submit"
          disabled={loading}
          className="w-full font-mono uppercase tracking-wider"
        >
          {loading ? t("auth.creatingAccount") : t("auth.signUp")}
        </ThemeButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/90"
        >
          {t("auth.signInLink")}
        </Link>
      </p>
    </ThemeCard>
  );
}
