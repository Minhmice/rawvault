import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ThemePanel } from "../theme-editor/ThemePanel";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-rv-bg overflow-hidden text-rv-text transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative overflow-hidden">
        {/* Topbar */}
        <Topbar />
        
        {/* Dynamic Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-rv-bg p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Theme Editor Panel (Overlay/Drawer) */}
      <ThemePanel />
    </div>
  );
}
