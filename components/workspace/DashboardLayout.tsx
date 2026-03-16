import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { AuthUser, BreadcrumbItem, LinkedAccount } from "@/lib/contracts";

// Dashboard layout: sidebar + topbar + main. Overlays (ThemePanel) live at root layout.

export type UnlinkAccountResult =
  | { ok: true }
  | { ok: false; error: string; code?: string };

type DashboardLayoutProps = {
  children: ReactNode;
  user: AuthUser | null;
  accounts: LinkedAccount[];
  breadcrumb: BreadcrumbItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenRoot: () => void;
  onBreadcrumbSegment?: (accountId: string, providerFolderId: string) => void;
  onSignOut: () => void;
  onSetActiveAccount: (accountId: string) => void;
  onUnlinkAccount: (accountId: string) => Promise<UnlinkAccountResult>;
  accountActionId: string | null;
  signOutLoading?: boolean;
};

export function DashboardLayout({
  children,
  user,
  accounts,
  breadcrumb,
  search,
  onSearchChange,
  onOpenRoot,
  onBreadcrumbSegment,
  onSignOut,
  onSetActiveAccount,
  onUnlinkAccount,
  accountActionId,
  signOutLoading = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <Sidebar
        user={user}
        accounts={accounts}
        onSetActiveAccount={onSetActiveAccount}
        onUnlinkAccount={onUnlinkAccount}
        accountActionId={accountActionId}
        onSignOut={onSignOut}
        signOutLoading={signOutLoading}
      />

      <div className="flex min-h-0 flex-1 flex-col relative overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          search={search}
          onSearchChange={onSearchChange}
          onOpenRoot={onOpenRoot}
          onBreadcrumbSegment={onBreadcrumbSegment}
        />
        <main className="flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8" role="main">
          <div className="mx-auto max-w-7xl h-full min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
