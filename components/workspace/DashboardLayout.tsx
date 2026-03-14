import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ThemePanel } from "../theme-editor/ThemePanel";
import type { AuthUser, BreadcrumbItem, LinkedAccount } from "@/lib/contracts";

type DashboardLayoutProps = {
  children: ReactNode;
  user: AuthUser | null;
  accounts: LinkedAccount[];
  breadcrumb: BreadcrumbItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenRoot: () => void;
  onSignOut: () => void;
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => void;
  accountActionId: string | null;
};

export function DashboardLayout({
  children,
  user,
  accounts,
  breadcrumb,
  search,
  onSearchChange,
  onOpenRoot,
  onSignOut,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <Sidebar
        user={user}
        accounts={accounts}
        onSetActiveAccount={onSetActiveAccount}
        onUnlinkAccount={onUnlinkAccount}
        accountActionId={accountActionId}
      />
      
      <div className="flex flex-col flex-1 relative overflow-hidden">
        <Topbar
          user={user}
          breadcrumb={breadcrumb}
          search={search}
          onSearchChange={onSearchChange}
          onOpenRoot={onOpenRoot}
          onSignOut={onSignOut}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>

      <ThemePanel />
    </div>
  );
}
