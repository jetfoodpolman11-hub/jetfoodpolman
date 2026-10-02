import { requireCourier } from "@/lib/auth/guards";
import Link from "next/link";
import { LogoutButton } from "@/components/shared/logout-button";
import { Clock, FilePlus, History, Home } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Kurir Portal — ${APP_NAME}`,
};

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCourier();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:max-w-3xl">
          <Link href="/courier/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white shadow-sm text-sm">
              JF
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 leading-none block">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {session.courier?.courierCode || "Kurir"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LogoutButton label="" showIcon={true} />
          </div>
        </div>
      </header>

      {/* Main Courier Content Container (Max width for mobile UX) */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:max-w-3xl">
        {children}
      </main>

      {/* Bottom Navigation for Mobile Field Operators */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-2 sm:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-4 px-2 text-center">
          <Link
            href="/courier/dashboard"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-orange-600"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Beranda</span>
          </Link>

          <Link
            href="/courier/attendance"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-orange-600"
          >
            <Clock className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Absen</span>
          </Link>

          <Link
            href="/courier/reports/new"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-orange-600"
          >
            <FilePlus className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Laporan</span>
          </Link>

          <Link
            href="/courier/history"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-orange-600"
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Riwayat</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
