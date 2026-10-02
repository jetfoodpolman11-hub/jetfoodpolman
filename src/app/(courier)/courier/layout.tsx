import { requireCourier } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-2xs">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4 sm:max-w-3xl lg:max-w-4xl">
          <Link href="/courier/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="JetFood Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              {session.courier?.courierCode || "JF-KURIR"}
            </span>
          </Link>

          {/* Desktop Nav Links (Hidden on small mobile) */}
          <nav className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Link
              href="/courier/dashboard"
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/courier/attendance"
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Absensi
            </Link>
            <Link
              href="/courier/reports/new"
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Input Laporan
            </Link>
            <Link
              href="/courier/history"
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Riwayat
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {session.profile?.fullName || "Kurir"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Kurir Lapangan</span>
            </div>
            <LogoutButton label="" showIcon={true} />
          </div>
        </div>
      </header>

      {/* Main Courier Content Container (Optimized for mobile field screen) */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:max-w-3xl lg:max-w-4xl">
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile Field Operators */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 sm:hidden shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-4 px-2 text-center">
          <Link
            href="/courier/dashboard"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-transform"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Beranda</span>
          </Link>

          <Link
            href="/courier/attendance"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-transform"
          >
            <Clock className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Absen</span>
          </Link>

          <Link
            href="/courier/reports/new"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-transform"
          >
            <FilePlus className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Laporan</span>
          </Link>

          <Link
            href="/courier/history"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-transform"
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Riwayat</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
