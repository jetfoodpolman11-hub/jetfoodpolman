import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { CourierLoginScreen } from "@/components/courier/courier-login-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan Harian Kurir — JetFood Polman",
  description: "Input data atau laporan harian kurir JetFood Polewali Mandar. Absen rute, barang/paket, dll.",
};

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session && session.user && session.profile) {
    if (session.profile.role === ROLES.KURIR) {
      redirect("/courier/dashboard");
    } else if (session.profile.role === ROLES.ADMIN) {
      redirect("/admin/dashboard");
    }
  }

  return <CourierLoginScreen />;
}
