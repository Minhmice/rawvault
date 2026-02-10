"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

interface DashboardShellProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const { toasts, add, dismiss } = useToast();

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0">
        <TopBar
          userEmail={userEmail}
          onUploadClick={() => {
            // Upload click is handled by drive page via context or callback.
            // We dispatch a custom event that drive page listens to.
            window.dispatchEvent(new CustomEvent("rawvault:upload-click"));
          }}
          addToast={add}
        />
        <main className="flex-1 overflow-auto p-4" role="main">
          {children}
        </main>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
