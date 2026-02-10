"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"password" | "magic_link">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const body =
        method === "magic_link"
          ? { method: "magic_link", email }
          : { method: "password", email, password };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Login failed");
        return;
      }

      if (method === "magic_link") {
        setMessage(data.message ?? "Check your email for the magic link.");
        return;
      }

      router.push("/drive");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-zinc-100">Sign in to RawVault</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drive-lite for RAW photos
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="you@example.com"
            />
          </div>

          {method === "password" && (
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-zinc-400">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required={method === "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("password")}
              className={`rounded-lg px-3 py-1.5 text-sm ${method === "password" ? "bg-cyan-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMethod("magic_link")}
              className={`rounded-lg px-3 py-1.5 text-sm ${method === "magic_link" ? "bg-cyan-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Magic link
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-400" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-600 py-2.5 font-medium text-white hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-cyan-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
