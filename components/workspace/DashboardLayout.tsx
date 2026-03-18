"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { MobileSheet } from "@/components/mobile/MobileSheet";
import { SidebarMobileSheetBody } from "@/components/workspace/SidebarAccountsPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AuthUser, BreadcrumbItem, LinkedAccount } from "@/lib/contracts";

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
  const { t } = useLocale();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        user={user}
        accounts={accounts}
        onSetActiveAccount={onSetActiveAccount}
        onUnlinkAccount={onUnlinkAccount}
        accountActionId={accountActionId}
        onSignOut={onSignOut}
        signOutLoading={signOutLoading}
      />

      <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          search={search}
          onSearchChange={onSearchChange}
          onOpenRoot={onOpenRoot}
          onBreadcrumbSegment={onBreadcrumbSegment}
        />
        <main
          className="box-border flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background p-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6 lg:p-8"
          role="main"
        >
          <div className="box-border flex min-h-min w-full min-w-0 flex-1 flex-col">{children}</div>
        </main>
      </div>

      <MobileSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        title={t("mobile.accounts")}
      >
        <SidebarMobileSheetBody
          user={user}
          accounts={accounts}
          onSetActiveAccount={onSetActiveAccount}
          onUnlinkAccount={onUnlinkAccount}
          accountActionId={accountActionId}
          onSignOut={onSignOut}
          signOutLoading={signOutLoading}
        />
      </MobileSheet>

      <BottomTabBar onMorePress={() => setMobileSheetOpen(true)} />
    </div>
  );
}
