import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ensureAdminDefaults } from "@/lib/admin-defaults";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  await ensureAdminDefaults();
  return <AdminShell>{children}</AdminShell>;
}
