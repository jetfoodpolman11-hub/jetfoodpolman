import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { AdminLoginScreen } from "@/components/admin/admin-login-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk Portal Admin — JetFood Polman",
  description: "Halaman login khusus Administrator Operasional JetFood Polman",
};

interface AdminLoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();

  if (session && session.user && session.profile && session.profile.role === ROLES.ADMIN) {
    redirect(params.redirectTo || "/admin/dashboard");
  }

  return <AdminLoginScreen redirectTo={params.redirectTo || "/admin/dashboard"} />;
}
