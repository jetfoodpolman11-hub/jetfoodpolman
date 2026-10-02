import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { CourierLoginScreen } from "@/components/courier/courier-login-screen";
import { AdminLoginScreen } from "@/components/admin/admin-login-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk Portal Operasional — JetFood Polman",
};

interface LoginPageProps {
  searchParams: Promise<{ role?: string; redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();

  if (session && session.user && session.profile) {
    if (session.profile.role === ROLES.KURIR) {
      redirect("/courier/dashboard");
    } else if (session.profile.role === ROLES.ADMIN) {
      redirect("/admin/dashboard");
    }
  }

  if (params.role === "admin") {
    return <AdminLoginScreen redirectTo={params.redirectTo} />;
  }

  return <CourierLoginScreen redirectTo={params.redirectTo} />;
}
