"use client";

import { useEffect, useState } from "react";
import { Search, Palette, UserCircle, Bell, LogOut } from "lucide-react";
import { useThemeComponents } from "../themes";
import type { AuthUser, BreadcrumbItem } from "@/lib/contracts";

type TopbarProps = {
  user: AuthUser | null;
  breadcrumb: BreadcrumbItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenRoot: () => void;
  onSignOut: () => void;
};

export function Topbar({
  user,
  breadcrumb,
  search,
  onSearchChange,
  onOpenRoot,
  onSignOut,
}: TopbarProps) {
  const { ThemeButton: Button, ThemeInput: Input } = useThemeComponents();
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
    // We will trigger a global event or context later. For now we use standard DOM dispatch or simple state.
    window.dispatchEvent(new CustomEvent("toggle-theme-panel"));
  };

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
            My Vault
          </button>
          {breadcrumb.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="font-bold">/</span>
              <span className="border-b-2 border-foreground text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5px] text-muted-foreground group-focus-within:text-foreground transition-colors duration-100" />
          <Input 
            placeholder="SEARCH IN VAULT..." 
            className="pl-9 font-mono uppercase tracking-wider text-xs border-b-2"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
        {user ? (
          <span className="hidden text-xs font-mono uppercase tracking-widest text-muted-foreground lg:inline">
            {user.email}
          </span>
        ) : null}
        <Button 
          variant="ghost" size="icon"
          onClick={toggleThemePanel}
          title="Customize Workspace"
          className="rounded-none border-2 border-transparent hover:border-foreground"
        >
          <Palette className="h-5 w-5 stroke-[1.5px]" />
        </Button>
        <Button 
          variant="ghost" size="icon"
          className="rounded-none border-2 border-transparent hover:border-foreground"
        >
          <Bell className="h-5 w-5 stroke-[1.5px]" />
        </Button>
        <Button 
          variant="ghost" size="icon"
          className="rounded-none border-2 border-transparent hover:border-foreground p-0"
        >
          <UserCircle className="h-6 w-6 stroke-[1.5px]" />
        </Button>
        {user ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            title="Sign out"
            className="rounded-none border-2 border-transparent hover:border-foreground"
          >
            <LogOut className="h-5 w-5 stroke-[1.5px]" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
