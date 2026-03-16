"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AuthUser } from "@/lib/contracts";

type ApiErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown };
};

type CurrentSessionResponse = {
  success: true;
  user: AuthUser | null;
  session: { userId: string; expiresAt: string | null } | null;
};

async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/session");
  const data = (await res.json().catch(() => null)) as CurrentSessionResponse | ApiErrorEnvelope | null;
  if (!res.ok || !data || typeof data !== "object" || !("user" in data)) {
    return null;
  }
  const session = data as CurrentSessionResponse;
  return session.user ?? null;
}

type AuthGuardMode = "requireAuth" | "requireGuest";

type AuthGuardProps = {
  children: React.ReactNode;
  mode: AuthGuardMode;
};

export function AuthGuard({ children, mode }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");

  const checkSession = useCallback(async () => {
    const u = await fetchSession();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    let cancelled = false;

    checkSession().then((u) => {
      if (cancelled) return;

      if (mode === "requireAuth") {
        if (!u) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
      } else {
        if (u) {
          const redirect = typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;
          router.replace(redirect && redirect.startsWith("/") ? redirect : "/");
          return;
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, pathname, router, checkSession]);

  if (user === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("auth.checkingSession")}</p>
      </div>
    );
  }

  if (mode === "requireAuth" && !user) {
    return null;
  }

  if (mode === "requireGuest" && user) {
    return null;
  }

  return <>{children}</>;
}
