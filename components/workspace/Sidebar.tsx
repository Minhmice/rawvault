"use client";

import Link from "next/link";
import { Cloud, HardDrive, LayoutGrid, Users, Settings, Trash2, Clock, Star } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: HardDrive, label: "My Vault", href: "/" },
  { icon: Users, label: "Shared with me", href: "/shared" },
  { icon: Clock, label: "Recent", href: "/recent" },
  { icon: Star, label: "Starred", href: "/starred" },
  { icon: Trash2, label: "Trash", href: "/trash" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full border-r border-rv-border bg-rv-surface flex flex-col transition-all duration-300 hidden md:flex">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-rv-border/50">
        <div className="flex items-center gap-2 text-rv-primary">
          <Cloud className="h-6 w-6" />
          <span className="font-heading font-bold text-lg text-rv-text tracking-tight">RawVault</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--rv-radius-md)]
                font-medium text-sm transition-colors duration-200
                ${isActive 
                  ? "bg-rv-primary/10 text-rv-primary" 
                  : "text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text"
                }
              `}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-rv-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Storage Info / Footer */}
      <div className="p-4 border-t border-rv-border/50 space-y-3">
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-[var(--rv-radius-md)] text-sm font-medium text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="px-3">
          <div className="h-1.5 w-full bg-rv-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-rv-primary w-[45%]" />
          </div>
          <p className="text-xs text-rv-text-muted mt-2">
            45 GB of 100 GB used
          </p>
        </div>
      </div>
    </aside>
  );
}
