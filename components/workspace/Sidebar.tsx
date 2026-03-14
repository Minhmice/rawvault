"use client";

import Link from "next/link";
import { Cloud, HardDrive, Users, Settings, Trash2, Clock, Star, MoreVertical, Plus } from "lucide-react";
import { usePathname } from "next/navigation";

import { useTheme } from "@/components/theme-provider/ThemeProvider";
import type { AuthUser, LinkedAccount } from "@/lib/contracts";
import { useThemeComponents } from "../themes";

// Shadcn UI components
import { Progress } from "@/components/theme/shadcn/progress";
import { Separator } from "@/components/theme/shadcn/separator";
import { ScrollArea } from "@/components/theme/shadcn/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/theme/shadcn/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/theme/shadcn/avatar";

const navItems = [
  { icon: HardDrive, label: "My Vault", href: "/" },
  { icon: Users, label: "Shared with me", href: "/shared" },
  { icon: Clock, label: "Recent", href: "/recent" },
  { icon: Star, label: "Starred", href: "/starred" },
];

const secondaryItems = [
  { icon: Trash2, label: "Trash", href: "/trash" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const NAV_THEME = {
  vivid: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
    active: "bg-rv-primary/10 text-rv-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
    inactive: "text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-text hover:translate-x-1",
  },
  monochrome: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-none border-l-4 text-sm font-mono uppercase tracking-wider transition-colors duration-100",
    active: "bg-rv-text text-rv-bg border-rv-text",
    inactive: "text-rv-text-muted border-transparent hover:bg-rv-text/10 hover:text-rv-text hover:border-rv-text",
  },
  bauhaus: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-none border-2 border-transparent text-sm font-bold uppercase tracking-wider transition-all duration-150",
    active: "bg-[#121212] text-white border-[#121212]",
    inactive: "text-[#121212] hover:bg-[#F0C020] hover:border-[#121212] hover:shadow-[3px_3px_0px_0px_#121212]",
  },
  linear: {
    base: "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out",
    active: "bg-rv-surface-hover text-rv-text border border-rv-border",
    inactive: "text-rv-text-muted border border-transparent hover:bg-rv-surface hover:text-rv-text hover:border-rv-border",
  }
};

const LOGO_THEME = {
  vivid: {
    wrapper: "h-16 flex items-center px-6 border-b border-rv-border bg-rv-bg/50 backdrop-blur-md shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-rv-primary to-[#8b5cf6] bg-clip-text text-transparent",
  },
  monochrome: {
    wrapper: "h-16 flex items-center px-6 border-b-4 border-rv-text bg-rv-bg shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-bold text-xl tracking-[0.2em] uppercase",
  },
  bauhaus: {
    wrapper: "h-16 flex items-center px-4 border-b-4 border-[#121212] bg-[#F0C020] shrink-0",
    inner: "flex items-center gap-2 text-[#121212]",
    text: "font-heading font-black text-xl tracking-tighter uppercase",
  },
  linear: {
    wrapper: "h-16 flex items-center px-6 border-b border-rv-border shrink-0",
    inner: "flex items-center gap-2 text-rv-text",
    text: "font-heading font-semibold text-lg tracking-wide",
  }
};

type SidebarProps = {
  user: AuthUser | null;
  accounts: LinkedAccount[];
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => void;
  accountActionId: string | null;
};

function formatStorage(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function Sidebar({
  user,
  accounts,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { ThemeButton: Button } = useThemeComponents();
  const name = (theme.name ?? "vivid") as keyof typeof NAV_THEME;
  const nav = NAV_THEME[name] ?? NAV_THEME.vivid;
  const logo = LOGO_THEME[name] ?? LOGO_THEME.vivid;
  
  const totalQuota = accounts.reduce((sum, account) => sum + account.quotaTotalBytes, 0);
  const totalUsed = accounts.reduce((sum, account) => sum + account.quotaUsedBytes, 0);
  const usage = totalQuota > 0 ? Math.min(100, Math.round((totalUsed / totalQuota) * 100)) : 0;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-rv-border bg-rv-bg max-md:hidden">
      {/* --- LOGO SECTION --- */}
      <div className={logo.wrapper}>
        <div className={logo.inner}>
          {name === "bauhaus" ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-[#121212]">
                <span className="text-sm font-black text-[#F0C020]">RV</span>
              </div>
              <span className={logo.text}>RawVault</span>
            </div>
          ) : (
            <>
              <Cloud className={`h-5 w-5 stroke-2 ${name === "monochrome" ? "stroke-rv-text" : "text-rv-primary"}`} />
              <span className={logo.text}>RawVault</span>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 w-full flex flex-col">
        {/* --- MAIN NAVIGATION --- */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${nav.base} ${isActive ? nav.active : nav.inactive}`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 stroke-[2px] transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="py-2">
            <Separator className="bg-rv-border/50" />
          </div>

          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            Other
          </p>
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${nav.base} ${isActive ? nav.active : nav.inactive}`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[2px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* --- LINKED ACCOUNTS SECTION --- */}
        <div className="px-4 pb-6 mt-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
              Linked Accounts
            </p>
            <Tooltip>
              <TooltipTrigger render={
                <Link
                  href="/api/storage/accounts/connect?provider=onedrive"
                  className="rounded-full p-1 transition-colors hover:bg-rv-surface-muted text-rv-text-muted hover:text-rv-text"
                />
              }>
                  <Plus className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Connect new OneDrive account</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rv-border p-4 text-center">
                <p className="text-sm text-rv-text-muted">No linked provider accounts yet.</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="group relative rounded-xl border border-rv-border bg-rv-surface p-3 shadow-sm transition-all hover:shadow-md hover:border-rv-primary/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="text-xs font-bold text-rv-text truncate">
                        {account.providerMetadata.providerLabel}
                      </p>
                      <Tooltip>
                        <TooltipTrigger render={
                          <p className="mt-0.5 text-xs text-rv-text-muted truncate cursor-default" />
                        }>
                            {account.accountEmail ?? account.providerMetadata.accountIdHint}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px] break-all">
                          {account.accountEmail ?? account.providerMetadata.accountIdHint}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {account.isActive && (
                      <span className="shrink-0 rounded-full bg-rv-primary/10 px-2 py-0.5 text-[10px] font-bold text-rv-primary uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-medium text-rv-text-muted">
                        Usage
                      </span>
                      <span className="text-[10px] font-medium text-rv-text">
                        {formatStorage(account.quotaUsedBytes)} / {formatStorage(account.quotaTotalBytes)}
                      </span>
                    </div>
                    <Progress 
                      value={account.quotaTotalBytes > 0 ? (account.quotaUsedBytes / account.quotaTotalBytes) * 100 : 0} 
                      className="h-1.5 bg-rv-surface-muted"
                      // Pass color via CSS variables for themes if Progress doesn't adapt out of the box
                      style={{ 
                        "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)"
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!account.isActive && (
                      <Button
                        variant="outline"
                        className="h-7 px-2 text-[10px] font-medium w-full"
                        onClick={() => onSetActiveAccount(account.id)}
                        disabled={accountActionId === account.id}
                      >
                        {accountActionId === account.id ? "Saving..." : "Set Active"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-[10px] font-medium w-full hover:bg-rv-danger/10 hover:text-rv-danger"
                      onClick={() => onUnlinkAccount(account.id)}
                      disabled={accountActionId === account.id}
                    >
                      Unlink
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* --- SESSION WIDGET AND GLOBAL QUOTA --- */}
      <div className="mt-auto shrink-0 border-t border-rv-border bg-rv-surface p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border border-rv-border/50">
            <AvatarImage src={`https://avatar.vercel.sh/${user?.email ?? 'anon'}.png`} />
            <AvatarFallback className="bg-rv-primary/10 text-rv-primary font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-rv-text truncate">
              {user?.email ?? "Signed out"}
            </p>
            <p className="text-[10px] text-rv-text-muted uppercase tracking-wider">
              {name === "bauhaus" ? "USER_SESSION" : "Personal"}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger render={
              <button className="h-8 w-8 flex justify-center items-center rounded-md hover:bg-rv-surface-muted text-rv-text-muted transition-colors" />
            }>
                <MoreVertical className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent align="end">
              <p>Account Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-rv-text-muted">Total Quota</span>
            <span className="font-semibold text-rv-text">{usage}%</span>
          </div>
          <Progress 
            value={usage} 
            className="h-2 bg-rv-border"
            style={{ 
              "--primary": name === "monochrome" || name === "bauhaus" ? "var(--rv-text)" : "var(--rv-primary)"
            } as React.CSSProperties}
          />
          <p className="text-[10px] text-rv-text-muted mt-1 text-right">
            {formatStorage(totalUsed)} of {formatStorage(totalQuota)}
          </p>
        </div>
      </div>
    </aside>
  );
}
