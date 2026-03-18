"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, HardDrive, Users, Settings, Trash2, Clock, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarLinkedAccountsSection,
  SidebarSessionFooter,
} from "@/components/workspace/SidebarAccountsPanel";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AuthUser, LinkedAccount } from "@/lib/contracts";

// Shadcn UI components
import { Separator } from "@/components/theme/shadcn/separator";
import { ScrollArea } from "@/components/theme/shadcn/scroll-area";

const navItemKeys = [
  { icon: HardDrive, labelKey: "sidebar.myVault" as const, href: "/" },
  { icon: Users, labelKey: "sidebar.sharedByMe" as const, href: "/shared" },
  { icon: Clock, labelKey: "sidebar.recent" as const, href: "/recent" },
  { icon: Star, labelKey: "sidebar.starred" as const, href: "/starred" },
];

const secondaryItemKeys = [
  { icon: Trash2, labelKey: "sidebar.trash" as const, href: "/trash" },
  { icon: Settings, labelKey: "sidebar.settings" as const, href: "/settings" },
];

type SidebarProps = {
  user: AuthUser | null;
  accounts: LinkedAccount[];
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  accountActionId: string | null;
  onSignOut: () => void;
  signOutLoading?: boolean;
};

export function Sidebar({
  user,
  accounts,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
  onSignOut,
  signOutLoading = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { themeName } = useTheme();
  const { t } = useLocale();
  const name = themeName;

  return (
    <aside className="flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-rv-border bg-rv-bg max-md:hidden">
      {/* --- LOGO SECTION --- */}
      <div className="rv-sidebar-logo-wrapper">
        <div className="rv-sidebar-logo-inner text-rv-text">
          {name === "bauhaus" ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-rv-text">
                <span className="text-sm font-black text-accent">RV</span>
              </div>
              <span className="rv-sidebar-logo-text">RawVault</span>
            </div>
          ) : (
            <>
              <Cloud className={`h-5 w-5 stroke-2 ${name === "monochrome" ? "stroke-rv-text" : "text-rv-primary"}`} />
              <span className="rv-sidebar-logo-text">RawVault</span>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        {/* --- MAIN NAVIGATION --- */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            {t("sidebar.menu")}
          </p>
          {navItemKeys.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group rv-sidebar-nav-item",
                  isActive ? "rv-sidebar-nav-active" : "rv-sidebar-nav-inactive"
                )}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 stroke-[2px] transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {t(item.labelKey)}
              </Link>
            );
          })}

          <div className="py-2">
            <Separator className="bg-rv-border/50" />
          </div>

          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-rv-text-muted">
            {t("sidebar.other")}
          </p>
          {secondaryItemKeys.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group rv-sidebar-nav-item",
                  isActive ? "rv-sidebar-nav-active" : "rv-sidebar-nav-inactive"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[2px]" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <SidebarLinkedAccountsSection
          user={user}
          accounts={accounts}
          onSetActiveAccount={onSetActiveAccount}
          onUnlinkAccount={onUnlinkAccount}
          accountActionId={accountActionId}
          onSignOut={onSignOut}
          signOutLoading={signOutLoading}
        />
      </ScrollArea>
      <SidebarSessionFooter
        user={user}
        accounts={accounts}
        onSignOut={onSignOut}
        signOutLoading={signOutLoading}
      />
    </aside>
  );
}
