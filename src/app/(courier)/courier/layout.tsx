import { requireCourier } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
import { Clock, ClipboardList, Home, Plus, User } from "lucide-react";
import { LogoutButton } from "@/components/shared/logout-button";
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
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans pb-24 sm:pb-8">
      {/* Top Header (Red Signature Bar) */}
      <header className="sticky top-0 z-40 bg-[#DC0000] border-b border-red-900/25 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5 sm:max-w-3xl lg:max-w-4xl">
          <Link href="/courier/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/logo-white.png"
              alt="JetFood Logo"
              width={130}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-white text-slate-950 px-3 py-0.5 text-[11px] font-black tracking-wider uppercase shadow-2xs">
              {session.courier?.courierCode || "JF-001"}
            </span>
          </Link>

          {/* Desktop Nav Links (Hidden on small mobile) */}
          <nav className="hidden sm:flex items-center gap-1 text-xs font-semibold text-white/90">
            <Link
              href="/courier/dashboard"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/courier/attendance"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
            >
              Absensi
            </Link>
            <Link
              href="/courier/reports/new"
              className="px-3 py-1.5 rounded-lg bg-white text-[#DC0000] hover:bg-red-50 font-bold transition-colors shadow-2xs"
            >
              + Input Laporan
            </Link>
            <Link
              href="/courier/history"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
            >
              Riwayat
            </Link>
            <Link
              href="/courier/account"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
            >
              Akun
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/courier/account"
              className="text-right hidden sm:block hover:opacity-85 transition-opacity"
            >
              <span className="text-xs font-bold text-white block leading-tight">
                {session.profile?.fullName || "Kurir"}
              </span>
              <span className="text-[10px] text-white/80 font-medium">Kurir JetFood</span>
            </Link>
            <LogoutButton
              label=""
              showIcon={true}
              className="inline-flex items-center justify-center p-2 text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
              iconClassName="h-6 w-6 stroke-[2.2]"
            />
          </div>
        </div>
      </header>

      {/* Main Courier Content Container (Optimized for mobile field screen) */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:max-w-3xl lg:max-w-4xl">
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile Field Operators */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto grid grid-cols-5 items-center px-1 text-center">
          <Link
            href="/courier/dashboard"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-all"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Beranda</span>
          </Link>

          <Link
            href="/courier/attendance"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-all"
          >
            <Clock className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Absensi</span>
          </Link>

          <Link
            href="/courier/reports/new"
            className="flex flex-col items-center justify-center -translate-y-4 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 ring-4 ring-white group-hover:bg-red-700 group-active:scale-95 transition-all">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] mt-1 font-bold text-red-600">Laporan</span>
          </Link>

          <Link
            href="/courier/history"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-all"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Riwayat</span>
          </Link>

          <Link
            href="/courier/account"
            className="flex flex-col items-center justify-center py-1 text-slate-600 hover:text-red-600 active:scale-95 transition-all"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Akun</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
