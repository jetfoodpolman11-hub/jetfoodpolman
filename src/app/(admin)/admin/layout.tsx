import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/shared/logout-button";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-200 bg-white shadow-xs">
        {/* Sidebar Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
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
        </div>

        {/* Sidebar Menu Tabs (Red Box Tabs) */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Menu Utama Admin
          </p>
          <nav aria-label="Navigasi Sidebar Admin" className="hidden md:flex">
            <AdminSidebarNav variant="sidebar" />
          </nav>
        </div>

        {/* Sidebar Footer: Admin Info & Logout */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-red-100 text-[#DC0000] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {session.profile?.fullName || "Administrator"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area (Right of Sidebar on Desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile Brand Logo (Hidden on Desktop since Sidebar shows it) */}
            <div className="flex md:hidden items-center gap-2.5">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Image
                  src="/images/logo.png"
                  alt="JetFood Logo"
                  width={110}
                  height={36}
                  className="h-7 w-auto object-contain"
                  priority
                />
                <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                  Admin
                </span>
              </Link>
            </div>

            {/* Desktop Breadcrumb / Title */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-[#DC0000]" />
              <span>Portal Manajemen Operasional — JetFood Polewali Mandar</span>
            </div>

            {/* User info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                  {session.profile?.fullName || "Administrator"}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {session.user.email}
                </span>
              </div>
              <div className="md:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Mobile & Small Tablet Navigation Strip (< 768px) */}
          <nav
            aria-label="Navigasi Mobile Admin"
            className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold"
          >
            <AdminSidebarNav variant="mobile" />
          </nav>
        </header>

        {/* Main Admin Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
