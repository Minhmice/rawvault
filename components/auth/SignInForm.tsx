"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { ThemeButton, ThemeCard, ThemeInput } = useThemeComponents();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const message = searchParams.get("message");
  const isSuccess = searchParams.get("success") === "1";
  useEffect(() => {
    if (message) {
      const decoded = decodeURIComponent(message);
      if (isSuccess) setSuccessMessage(decoded);
      else setError(decoded);
    }
  }, [message, isSuccess]);

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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = (await res.json().catch(() => null)) as ApiErrorEnvelope | { success?: boolean };

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object"
            ? (data.error as { message?: string }).message ?? t("auth.signInFailed")
            : t("auth.signInFailed");
        setError(msg);
        return;
      }

      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
      router.refresh();
    } catch (err) {
      setError(formatErrorMessage(err, t("auth.signInFailedTryAgain")));
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
        {t("auth.signInToAccount")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="signin-email" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("auth.email")}
          </label>
          <ThemeInput
            id="signin-email"
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
          <label htmlFor="signin-password" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("auth.password")}
          </label>
          <ThemeInput
            id="signin-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>

        {error ? (
          <div className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-[var(--radius-sm)] border border-green-400/40 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        ) : null}

        <ThemeButton
          type="submit"
          disabled={loading}
          className="w-full font-mono uppercase tracking-wider"
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </ThemeButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.dontHaveAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/90"
        >
          {t("auth.signUp")}
        </Link>
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.devLabel")}{" "}
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch("/api/auth/dev/seeded-signin", { method: "POST" });
                  if (!res.ok) throw new Error(t("auth.seededSignInFailed"));
                  router.push("/");
                  router.refresh();
                } catch (err) {
                  setError(formatErrorMessage(err, t("auth.seededSignInFailed")));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="font-mono text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {t("auth.qaSignIn")}
            </button>
          </p>
        </div>
      )}
    </ThemeCard>
  );
}
