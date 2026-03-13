"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  authCurrentSessionResponseSchema,
  authCurrentUserResponseSchema,
  type AuthCurrentSessionResponse,
  type AuthCurrentUserResponse,
} from "@/lib/contracts";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type AsyncState = "idle" | "loading" | "error" | "success";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const defaultDevSignInPath = "/api/auth/dev/seeded-signin";
const fallbackDevSignInPaths = [
  "/api/auth/dev-signin",
  "/api/auth/dev/signin",
  "/api/auth/signin/dev",
];

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Authentication request failed.";
}

function parseApiError(payload: unknown): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }
  return "Request failed.";
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

export function AuthTestingSection() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionState, setSessionState] = useState<AsyncState>("loading");
  const [actionState, setActionState] = useState<AsyncState>("idle");
  const [serverState, setServerState] = useState<AsyncState>("idle");
  const [devSignInState, setDevSignInState] = useState<AsyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [serverSession, setServerSession] = useState<AuthCurrentSessionResponse["session"] | null>(
    null,
  );
  const [serverUser, setServerUser] = useState<AuthCurrentUserResponse["user"] | null>(null);
  const [lastServerCheckAt, setLastServerCheckAt] = useState<string | null>(null);
  const [devSignInPath, setDevSignInPath] = useState(defaultDevSignInPath);
  const [devSignInToken, setDevSignInToken] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const loadServerAuthDiagnostics = useCallback(async () => {
    try {
      setServerState("loading");
      setServerErrorMessage(null);

      const [sessionResponse, userResponse] = await Promise.all([
        fetch("/api/auth/session", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }),
        fetch("/api/auth/user", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }),
      ]);

      const sessionPayload = await readPayload(sessionResponse);
      if (!sessionResponse.ok) {
        throw new Error(`Session endpoint: ${parseApiError(sessionPayload)}`);
      }

      const userPayload = await readPayload(userResponse);
      if (!userResponse.ok) {
        throw new Error(`User endpoint: ${parseApiError(userPayload)}`);
      }

      const parsedSession = authCurrentSessionResponseSchema.parse(sessionPayload);
      const parsedUser = authCurrentUserResponseSchema.parse(userPayload);

      setServerSession(parsedSession.session);
      setServerUser(parsedUser.user);
      setLastServerCheckAt(new Date().toLocaleTimeString());
      setServerState("success");
    } catch (error) {
      setServerState("error");
      setServerErrorMessage(parseErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSessionState("error");
      setErrorMessage("Supabase public env variables are missing.");
      return;
    }

    let active = true;
    const readSession = async () => {
      setSessionState("loading");
      const { data, error } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      if (error) {
        setSessionState("error");
        setErrorMessage(error.message);
        return;
      }
      setSession(data.session ?? null);
      setSessionState("success");
      void loadServerAuthDiagnostics();
    };

    void readSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionState("success");
      void loadServerAuthDiagnostics();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadServerAuthDiagnostics, supabase]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    try {
      setActionState("loading");
      setErrorMessage(null);
      setNoticeMessage(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim(),
        password: signInPassword,
      });
      if (error) {
        throw error;
      }
      setNoticeMessage("Signed in.");
      setActionState("success");
      await loadServerAuthDiagnostics();
    } catch (error) {
      setActionState("error");
      setErrorMessage(parseErrorMessage(error));
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    try {
      setActionState("loading");
      setErrorMessage(null);
      setNoticeMessage(null);
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail.trim(),
        password: signUpPassword,
      });
      if (error) {
        throw error;
      }

      setNoticeMessage(
        data.session
          ? "Sign-up complete and session active."
          : "Sign-up submitted. Confirm email if your project requires verification.",
      );
      setActionState("success");
      await loadServerAuthDiagnostics();
    } catch (error) {
      setActionState("error");
      setErrorMessage(parseErrorMessage(error));
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    try {
      setActionState("loading");
      setErrorMessage(null);
      setNoticeMessage(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setNoticeMessage("Signed out.");
      setActionState("success");
      await loadServerAuthDiagnostics();
    } catch (error) {
      setActionState("error");
      setErrorMessage(parseErrorMessage(error));
    }
  };

  const handleDeterministicDevSignIn = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const requestedPath = devSignInPath.trim() || defaultDevSignInPath;
    const endpointCandidates = [
      requestedPath,
      ...fallbackDevSignInPaths.filter((endpoint) => endpoint !== requestedPath),
    ];

    try {
      setDevSignInState("loading");
      setErrorMessage(null);
      setNoticeMessage(null);

      let appliedEndpoint: string | null = null;

      for (const endpoint of endpointCandidates) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(devSignInToken.trim().length > 0
              ? { "x-rawvault-dev-token": devSignInToken.trim() }
              : {}),
          },
          body: JSON.stringify({}),
        });

        const payload = await readPayload(response);
        if (response.status === 404) {
          continue;
        }
        if (!response.ok) {
          throw new Error(`Dev sign-in failed at ${endpoint}: ${parseApiError(payload)}`);
        }
        appliedEndpoint = endpoint;
        break;
      }

      if (!appliedEndpoint) {
        throw new Error(
          `No deterministic dev sign-in endpoint found. Checked: ${endpointCandidates.join(", ")}`,
        );
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      setSession(data.session ?? null);
      setSessionState("success");
      await loadServerAuthDiagnostics();
      setNoticeMessage(
        `Dev sign-in completed via ${appliedEndpoint}. If your backend only sets HTTP-only cookies, refresh once to sync the browser client session.`,
      );
      setDevSignInState("success");
    } catch (error) {
      setDevSignInState("error");
      setErrorMessage(parseErrorMessage(error));
    }
  }, [devSignInPath, devSignInToken, loadServerAuthDiagnostics, supabase]);

  const isBusy = actionState === "loading" || devSignInState === "loading";
  const signedIn = Boolean(session?.user);
  const sessionExpiresAt =
    typeof session?.expires_at === "number"
      ? new Date(session.expires_at * 1000).toLocaleString()
      : "n/a";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auth test flow</CardTitle>
        <CardDescription>
          Minimal Supabase auth controls for slice-2 API testing (sign up, sign in, sign out, and
          session visibility).
        </CardDescription>
      </CardHeader>
      <CardContent className="rv-stack">
        {sessionState === "loading" ? (
          <div className="rv-list" aria-live="polite" aria-busy="true">
            <Skeleton height={52} />
          </div>
        ) : (
          <section className="rv-row" aria-live="polite" aria-label="Client auth session state">
            <div className="rv-inline">
              <strong>Client session:</strong>
              <Badge tone={signedIn ? "success" : "muted"}>
                {signedIn ? "Signed in" : "Signed out"}
              </Badge>
              <span className="rv-muted">{session?.user.email ?? "No active user email."}</span>
            </div>
            <div className="rv-meta">
              <span>
                {signedIn
                  ? "Browser auth session is active. Explorer and dispatch checks can run as this user."
                  : "No browser auth session. Protected routes should fail until you sign in."}
              </span>
              <span>User ID: {session?.user.id ?? "n/a"}</span>
              <span>Session expires: {sessionExpiresAt}</span>
            </div>
          </section>
        )}

        <section className="rv-row" aria-label="Server auth diagnostic state">
          <div className="rv-inline">
            <strong>Server auth checks:</strong>
            <Badge tone={serverSession ? "success" : "muted"}>
              /api/auth/session {serverSession ? "active" : "none"}
            </Badge>
            <Badge tone={serverUser ? "success" : "muted"}>
              /api/auth/user {serverUser ? "present" : "none"}
            </Badge>
            <span className="rv-muted">
              {lastServerCheckAt ? `Refreshed ${lastServerCheckAt}` : "Not checked yet."}
            </span>
          </div>
          <div className="rv-meta">
            <span>Server user ID: {serverUser?.id ?? "n/a"}</span>
            <span>Server user email: {serverUser?.email ?? "n/a"}</span>
            <span>Server session expires: {serverSession?.expiresAt ?? "n/a"}</span>
          </div>
          <div className="rv-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={serverState === "loading"}
              onClick={() => {
                void loadServerAuthDiagnostics();
              }}
            >
              {serverState === "loading" ? "Refreshing checks..." : "Refresh server checks"}
            </Button>
          </div>
        </section>

        {noticeMessage ? <p className="rv-muted">{noticeMessage}</p> : null}

        {errorMessage ? (
          <div className="rv-alert" role="alert">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {serverErrorMessage ? (
          <div className="rv-alert" role="alert">
            <p>{serverErrorMessage}</p>
          </div>
        ) : null}

        <section className="rv-auth-grid" aria-label="Auth forms">
          <form className="rv-auth-form" onSubmit={handleSignIn}>
            <h3 className="rv-subtitle">Sign in</h3>
            <label className="rv-field">
              <span className="rv-field-label">Email</span>
              <input
                className="rv-input"
                type="email"
                autoComplete="email"
                required
                value={signInEmail}
                onChange={(event) => setSignInEmail(event.currentTarget.value)}
              />
            </label>
            <label className="rv-field">
              <span className="rv-field-label">Password</span>
              <input
                className="rv-input"
                type="password"
                autoComplete="current-password"
                required
                value={signInPassword}
                onChange={(event) => setSignInPassword(event.currentTarget.value)}
              />
            </label>
            <Button type="submit" disabled={isBusy || !supabase}>
              {actionState === "loading" ? "Authenticating..." : "Sign in"}
            </Button>
          </form>

          <form className="rv-auth-form" onSubmit={handleSignUp}>
            <h3 className="rv-subtitle">Sign up</h3>
            <label className="rv-field">
              <span className="rv-field-label">Email</span>
              <input
                className="rv-input"
                type="email"
                autoComplete="email"
                required
                value={signUpEmail}
                onChange={(event) => setSignUpEmail(event.currentTarget.value)}
              />
            </label>
            <label className="rv-field">
              <span className="rv-field-label">Password</span>
              <input
                className="rv-input"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={signUpPassword}
                onChange={(event) => setSignUpPassword(event.currentTarget.value)}
              />
            </label>
            <Button type="submit" variant="secondary" disabled={isBusy || !supabase}>
              {actionState === "loading" ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </section>

        <section className="rv-row" aria-label="Optional deterministic dev sign-in helper">
          <div className="rv-inline">
            <strong>Dev sign-in helper:</strong>
            <Badge tone="muted">Optional</Badge>
          </div>
          <p className="rv-muted">
            Use this only when local dev enables deterministic seeded auth (for example with
            <code> RAWVAULT_DEV_SEEDED_AUTH_ENABLED=true</code>).
          </p>
          <label className="rv-field">
            <span className="rv-field-label">Endpoint path</span>
            <input
              className="rv-input"
              value={devSignInPath}
              onChange={(event) => setDevSignInPath(event.currentTarget.value)}
              placeholder={defaultDevSignInPath}
            />
          </label>
          <label className="rv-field">
            <span className="rv-field-label">Dev token</span>
            <input
              className="rv-input"
              value={devSignInToken}
              onChange={(event) => setDevSignInToken(event.currentTarget.value)}
              placeholder="Required when backend enforces dev token"
            />
          </label>
          <div className="rv-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={isBusy || !supabase}
              onClick={handleDeterministicDevSignIn}
            >
              {devSignInState === "loading" ? "Running dev sign-in..." : "Run deterministic dev sign-in"}
            </Button>
          </div>
        </section>

        <div className="rv-actions">
          <Button
            type="button"
            variant="danger"
            disabled={isBusy || !supabase || !session?.user}
            onClick={handleSignOut}
          >
            {actionState === "loading" ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
