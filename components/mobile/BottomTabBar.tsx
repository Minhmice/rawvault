"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, Users, Clock, Star, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

const tabs = [
  { href: "/", labelKey: "sidebar.myVault" as const, Icon: HardDrive },
  { href: "/shared", labelKey: "sidebar.sharedByMe" as const, Icon: Users },
  { href: "/recent", labelKey: "sidebar.recent" as const, Icon: Clock },
  { href: "/starred", labelKey: "sidebar.starred" as const, Icon: Star },
] as const;

export type BottomTabBarProps = {
  onMorePress: () => void;
};

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { themeName } = useTheme();
  const name = themeName;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[90] flex border-t border-rv-border bg-rv-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      )}
      aria-label={t("sidebar.menu")}
    >
      {tabs.map(({ href, labelKey, Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn("rv-bottomtab-item", active ? "rv-bottomtab-active" : "rv-bottomtab-inactive")}
            prefetch
          >
            <Icon className={cn("h-5 w-5", active && name === "vivid" && "scale-110")} strokeWidth={2} />
            <span className="max-w-[4.5rem] truncate text-center leading-tight">{t(labelKey)}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMorePress}
        className={cn("rv-bottomtab-item rv-bottomtab-inactive tap-highlight-transparent")}
        aria-label={t("mobile.more")}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span>{t("mobile.more")}</span>
      </button>
    </nav>
  );
}
