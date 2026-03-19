"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoadingOverlay } from "@/components/ui/LoadingOverlayContext";
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
  const { setSessionLoading } = useLoadingOverlay();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");

  const checkSession = useCallback(async () => {
    const u = await fetchSession();
    setUser(u);
    setSessionLoading(false);
    return u;
  }, [setSessionLoading]);

  useEffect(() => {
    setSessionLoading(true);
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      setSessionLoading(false);
    };
  }, [mode, pathname, router, checkSession, setSessionLoading]);

  if (user === "loading") {
    return null;
  }

  if (mode === "requireAuth" && !user) {
    return null;
  }

  if (mode === "requireGuest" && user) {
    return null;
  }

  return <>{children}</>;
}
