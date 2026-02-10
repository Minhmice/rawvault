"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ToastType } from "@/components/ui/Toast";

interface TopBarProps {
  onUploadClick: () => void;
  userEmail: string | null;
  addToast: (type: ToastType, message: string) => void;
}

export function TopBar({ onUploadClick, userEmail, addToast }: TopBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchQ(value);
    window.dispatchEvent(new CustomEvent("rawvault:search", { detail: { q: value } }));
  };

  const handleLogout = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        addToast("success", "Signed out");
        router.push("/login");
        router.refresh();
      }
    } catch {
      addToast("error", "Failed to sign out");
    }
    setMenuOpen(false);
  }, [router, addToast]);

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4"
      role="banner"
    >
      <div className="flex flex-1 items-center gap-4">
        <label className="sr-only" htmlFor="topbar-search">
          Search files
        </label>
        <input
          id="topbar-search"
          type="search"
          placeholder="Search..."
          value={searchQ}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Upload
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            {(userEmail?.[0] ?? "?").toUpperCase()}
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
                role="menu"
                aria-label="User menu"
              >
                <div className="border-b border-zinc-700 px-3 py-2 text-xs text-zinc-500">
                  {userEmail ?? "Not signed in"}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
