import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
