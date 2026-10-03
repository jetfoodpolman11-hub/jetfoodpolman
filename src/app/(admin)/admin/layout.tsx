import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/shared/logout-button";
import { ShieldCheck, Users, CalendarCheck, FileText, Database, LayoutDashboard, BarChart3 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Admin Portal — ${APP_NAME}`,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/images/logo.png"
                alt="JetFood Logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
              <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                Admin
              </span>
            </Link>

            {/* Admin Nav Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/couriers"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Users className="h-4 w-4" />
                Kurir
              </Link>
              <Link
                href="/admin/attendance"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <CalendarCheck className="h-4 w-4" />
                Absensi
              </Link>
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Laporan
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Rekap &amp; Analitik
              </Link>
              <Link
                href="/admin/master-data"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Database className="h-4 w-4" />
                Master Data
              </Link>
            </nav>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                {session.profile?.fullName || "Administrator"}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{session.user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Mobile & Small Tablet Navigation Strip (< 768px) */}
        <nav
          aria-label="Navigasi Mobile Admin"
          className="flex md:hidden items-center gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          <Link
            href="/admin/dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-red-600" />
            Dashboard
          </Link>
          <Link
            href="/admin/couriers"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-red-600" />
            Kurir
          </Link>
          <Link
            href="/admin/attendance"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-red-600" />
            Absensi
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-red-600" />
            Laporan
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5 text-red-600" />
            Analitik
          </Link>
          <Link
            href="/admin/master-data"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200/80 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-red-600" />
            Master Data
          </Link>
        </nav>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
