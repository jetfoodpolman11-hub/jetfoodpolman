import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import { LogoutButton } from "@/components/shared/logout-button";
import { ShieldCheck, Users, CalendarCheck, FileText, Database, LayoutDashboard } from "lucide-react";
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
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 font-bold text-white shadow-sm">
                JF
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                  {APP_NAME}
                </span>
                <span className="text-[10px] text-orange-600 font-bold tracking-wide uppercase block">
                  Admin Portal
                </span>
              </div>
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
                <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                {session.profile?.fullName || "Administrator"}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{session.user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
