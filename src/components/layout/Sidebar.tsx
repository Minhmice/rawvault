"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/drive", label: "My Drive", icon: "📁" },
  { href: "/recent", label: "Recent", icon: "🕐" },
  { href: "/trash", label: "Trash", icon: "🗑️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-950"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link href="/drive" className="font-semibold text-cyan-400">
          RawVault
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
