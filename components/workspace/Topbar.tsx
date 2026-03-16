"use client";

import { useEffect, useState } from "react";
import { Search, Palette, Bell, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useThemeComponents } from "../themes";
import type { BreadcrumbItem } from "@/lib/contracts";
import type { Locale } from "@/lib/i18n/messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/theme/shadcn/dropdown-menu";

type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";

const TOPBAR_BUTTON: Record<ThemeName, string> = {
  vivid: "rounded-xl border border-transparent hover:bg-muted/80 hover:border-primary/30 transition-all duration-200",
  monochrome: "rounded-none border-2 border-transparent hover:border-foreground hover:bg-foreground/5 transition-colors duration-100",
  bauhaus: "rounded-none border-2 border-transparent hover:border-foreground hover:bg-accent transition-all duration-150",
  linear: "rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10 transition-all duration-250",
};

const TOPBAR_SEARCH: Record<ThemeName, string> = {
  vivid: "rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40",
  monochrome: "rounded-none border-b-2 border-foreground/30 focus-within:border-foreground",
  bauhaus: "rounded-none border-2 border-foreground/50 focus-within:border-foreground",
  linear: "rounded-lg border border-white/10 focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/50",
};

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
  const { theme } = useTheme();
  const { locale, setLocale, t, localeLabel } = useLocale();
  const { ThemeButton: Button, ThemeInput: Input } = useThemeComponents();
  const name = (theme.name ?? "vivid") as ThemeName;
  const btnClass = TOPBAR_BUTTON[name] ?? TOPBAR_BUTTON.vivid;
  const searchClass = TOPBAR_SEARCH[name] ?? TOPBAR_SEARCH.vivid;
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
    window.dispatchEvent(new CustomEvent("toggle-theme-panel"));
  };

  const locales: Locale[] = ["en", "vi"];

  return (
    <header
      className={`
        h-16 flex items-center justify-between px-4 md:px-6 z-10
        transition-colors duration-100
        ${scrolled ? "bg-background border-b border-border" : "bg-transparent"}
      `}
    >
      <div className="flex-1 flex items-center">
        <div className="hidden md:flex items-center gap-2 text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
          <button type="button" onClick={onOpenRoot} className="hover:text-foreground">
            {t("topbar.myVault")}
          </button>
          {breadcrumb.map((item, index) => (
            <div key={item.id ?? `seg-${index}`} className="flex items-center gap-2">
              <span className="font-bold">/</span>
              {item.accountId === null && item.providerFolderId === null ? (
                <button
                  type="button"
                  onClick={onOpenRoot}
                  className="border-b-2 border-foreground text-foreground hover:opacity-80"
                >
                  {item.name}
                </button>
              ) : item.accountId != null && item.providerFolderId != null && onBreadcrumbSegment ? (
                <button
                  type="button"
                  onClick={() => onBreadcrumbSegment(item.accountId!, item.providerFolderId!)}
                  className="border-b-2 border-foreground text-foreground hover:opacity-80"
                >
                  {item.name}
                </button>
              ) : (
                <span className="border-b-2 border-foreground text-foreground">{item.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className={`relative group transition-all duration-200 ${searchClass}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5px] text-muted-foreground group-focus-within:text-foreground transition-colors duration-100" />
          <Input
            placeholder={t("topbar.searchPlaceholder")}
            className="pl-9 font-mono uppercase tracking-wider text-xs border-0 focus:ring-0 focus:shadow-none"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleThemePanel}
          title={t("topbar.customizeWorkspace")}
          className={btnClass}
        >
          <Palette className="h-5 w-5 stroke-[1.5px]" />
        </Button>
        <Button variant="ghost" size="icon" className={btnClass} title={t("topbar.notifications")}>
          <Bell className="h-5 w-5 stroke-[1.5px]" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className={`${btnClass} font-mono uppercase tracking-wider text-xs min-w-[4rem]`}
                aria-label={`${t("topbar.language")} (${t("topbar.languageCurrent")}: ${localeLabel(locale)})`}
                aria-haspopup="listbox"
              >
                {locale === "vi" ? "VI" : "EN"}
              </Button>
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
    </header>
  );
}
