"use client";

import { useEffect, useState } from "react";
import { Search, Palette, UserCircle, Bell } from "lucide-react";
import { Input } from "../core/Input";

export function Topbar() {
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
        transition-all duration-300
        ${scrolled ? "bg-rv-surface/80 backdrop-blur-md border-b border-rv-border shadow-sm" : "bg-transparent"}
      `}
    >
      {/* Breadcrumbs or Path */}
      <div className="flex-1 flex items-center">
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-rv-text-muted">
          <span>My Vault</span>
          <span>/</span>
          <span className="text-rv-text">Photography 2024</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rv-text-muted" />
          <Input 
            placeholder="Search in Vault..." 
            className="pl-9 bg-rv-surface-muted border-transparent focus:border-rv-primary focus:bg-rv-surface h-9 rounded-full"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
        <button 
          onClick={toggleThemePanel}
          className="p-2 rounded-full text-rv-text-muted hover:bg-rv-surface-muted hover:text-rv-primary transition-colors focus:outline-none focus:ring-2 focus:ring-rv-primary"
          title="Customize Workspace"
        >
          <Palette className="h-5 w-5" />
        </button>
        <button 
          className="p-2 rounded-full text-rv-text-muted hover:bg-rv-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-rv-primary"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button 
          className="p-1 rounded-full text-rv-text-muted hover:text-rv-primary transition-colors focus:outline-none focus:ring-2 focus:ring-rv-primary"
        >
          <UserCircle className="h-8 w-8" />
        </button>
      </div>
    </header>
  );
}
