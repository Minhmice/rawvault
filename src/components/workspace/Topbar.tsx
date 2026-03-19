"use client";

import { useEffect, useState } from "react";
import { Search, Palette, Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { AppButton } from "@/components/app/AppButton";
import { AppIconButton } from "@/components/app/AppIconButton";
import { AppInput } from "@/components/app/AppInput";
import type { BreadcrumbItem } from "@/lib/contracts";
import type { Locale } from "@/lib/i18n/messages";
import { THEME_PANEL_TOGGLE_EVENT } from "@/lib/theme/events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/theme/shadcn/dropdown-menu";

type TopbarProps = {
  breadcrumb: BreadcrumbItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenRoot: () => void;
  /** When user clicks a breadcrumb segment other than root (explorer mode). */
  onBreadcrumbSegment?: (accountId: string, providerFolderId: string) => void;
};

export function Topbar({
  breadcrumb,
  search,
  onSearchChange,
  onOpenRoot,
  onBreadcrumbSegment,
}: TopbarProps) {
  const { themeName } = useTheme();
  const { locale, setLocale, t, localeLabel } = useLocale();
  void themeName; // theme selected via CSS (data-theme selectors)
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const mainContent = document.querySelector("main");
    if (!mainContent) return;

    const handleScroll = () => {
      setScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => mainContent.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleThemePanel = () => {
    window.dispatchEvent(new CustomEvent(THEME_PANEL_TOGGLE_EVENT));
  };

  const locales: Locale[] = ["en", "vi"];

  const currentFolderName =
    breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 1]?.name ?? null : null;

  const mobileCrumb = currentFolderName ? `${t("topbar.myVault")} / ${currentFolderName}` : t("topbar.myVault");

  return (
    <header
      className={cn(
        "z-10 flex w-full shrink-0 flex-col transition-colors duration-100",
        scrolled ? "border-b border-border bg-background" : "bg-transparent"
      )}
    >
      <div className="flex h-16 items-center justify-between px-3 md:px-6">
      <div className="hidden min-w-0 flex-1 items-center md:flex">
        <div className="flex items-center gap-2 text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
          <button type="button" onClick={onOpenRoot} className="hover:text-foreground">
            {t("topbar.myVault")}
          </button>
          {currentFolderName ? (
            <>
              <span className="font-bold">/</span>
              <span className="border-b-2 border-foreground text-foreground">{currentFolderName}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 flex-1 md:hidden">
        <button
          type="button"
          onClick={onOpenRoot}
          className="max-w-full truncate text-left text-sm font-medium text-foreground"
        >
          {mobileCrumb}
        </button>
      </div>

      <div className="mx-4 hidden max-w-md flex-1 md:block">
        <div className="rv-topbar-search relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5px] text-muted-foreground transition-colors duration-100 group-focus-within:text-foreground" />
          <AppInput
            placeholder={t("topbar.searchPlaceholder")}
            className="border-0 pl-9 font-mono text-xs uppercase tracking-wider focus:shadow-none focus:ring-0"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 md:gap-4">
        <AppIconButton
          variant="ghost"
          onClick={toggleThemePanel}
          title={t("topbar.customizeWorkspace")}
          className="rv-topbar-btn h-9 w-9"
          aria-label={t("topbar.customizeWorkspace")}
        >
          <Palette className="h-5 w-5 stroke-[1.5px]" />
        </AppIconButton>
        <AppIconButton
          variant="ghost"
          className="rv-topbar-btn h-9 w-9"
          title={t("topbar.notifications")}
          aria-label={t("topbar.notifications")}
        >
          <Bell className="h-5 w-5 stroke-[1.5px]" />
        </AppIconButton>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className={cn("rv-topbar-btn h-9 w-9 font-mono text-xs uppercase tracking-wider")}
                aria-label={`${t("topbar.language")} (${t("topbar.languageCurrent")}: ${localeLabel(locale)})`}
                aria-haspopup="listbox"
              >
                {locale === "vi" ? "VI" : "EN"}
              </AppButton>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8} className="min-w-[140px]">
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => setLocale(loc)}
                className="flex items-center justify-between gap-2"
              >
                <span>{localeLabel(loc)}</span>
                {locale === loc && <Check className="h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>

      <div className="border-t border-border/40 px-3 pb-2 pt-2 md:hidden">
        <div className="rv-topbar-search relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5px] text-muted-foreground" />
          <AppInput
            placeholder={t("topbar.searchPlaceholder")}
            className="border-0 pl-9 font-mono text-xs uppercase tracking-wider focus:shadow-none focus:ring-0"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
