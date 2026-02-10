import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }
  return <DashboardShell userEmail={user.email ?? null}>{children}</DashboardShell>;
}
