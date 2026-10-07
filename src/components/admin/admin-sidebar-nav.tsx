"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  BarChart3,
  Database,
  ChevronRight,
  ChevronDown,
  Layers,
  ShoppingBag,
  Package,
  Zap,
  Bike,
  Sparkles,
} from "lucide-react";

const ADMIN_MENU_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    mobileLabel: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    href: "/admin/couriers",
    label: "Kurir",
    mobileLabel: "Kurir",
    Icon: Users,
  },
  {
    href: "/admin/attendance",
    label: "Absensi",
    mobileLabel: "Absensi",
    Icon: CalendarCheck,
  },
  {
    href: "/admin/reports",
    label: "Laporan",
    mobileLabel: "Laporan",
    Icon: FileText,
  },
  {
    href: "/admin/analytics",
    label: "Rekap & Analitik",
    mobileLabel: "Analitik",
    Icon: BarChart3,
    hasSubMenu: true,
  },
  {
    href: "/admin/master-data",
    label: "Master Data",
    mobileLabel: "Master Data",
    Icon: Database,
  },
];

const ANALYTICS_SUB_MENU = [
  {
    key: "akumulasi",
    label: "Akumulasi",
    desc: "Total Keseluruhan",
    Icon: Layers,
  },
  {
    key: "jastip",
    label: "Jastip",
    desc: "Layanan Jasa Belanja",
    Icon: ShoppingBag,
  },
  {
    key: "paket",
    label: "Paket",
    desc: "Jemput - Antar Paket",
    Icon: Package,
  },
  {
    key: "langsung",
    label: "Langsung",
    desc: "Order Tanpa Admin",
    Icon: Zap,
  },
  {
    key: "ojol",
    label: "Ojol",
    desc: "Ojek Online",
    Icon: Bike,
  },
  {
    key: "random",
    label: "Random",
    desc: "Jasa Layanan Apa Saja",
    Icon: Sparkles,
  },
];

function AnalyticsSubMenuList({ isAnalyticsPath }: { isAnalyticsPath: boolean }) {
  const searchParams = useSearchParams();
  const activeFeature = (searchParams.get("feature") || "akumulasi").toLowerCase();
  const currentPeriod = searchParams.get("period");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const buildSubHref = (featureKey: string) => {
    const params = new URLSearchParams();
    params.set("feature", featureKey);
    if (currentPeriod) params.set("period", currentPeriod);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/admin/analytics?${params.toString()}`;
  };

  return (
    <div className="mt-1.5 ml-3 pl-3 border-l-2 border-red-200 flex flex-col gap-1.5">
      {ANALYTICS_SUB_MENU.map(({ key, label, desc, Icon }) => {
        const isSubActive = isAnalyticsPath && activeFeature === key;

        return (
          <Link
            key={key}
            href={buildSubHref(key)}
            className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all select-none ${
              isSubActive
                ? "bg-[#990000] text-white ring-2 ring-[#DC0000]/30 shadow-sm"
                : "bg-[#DC0000] text-white hover:bg-[#b80000] shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSubActive
                    ? "bg-white text-[#DC0000]"
                    : "bg-white/15 text-white group-hover:bg-white/25"
                }`}
              >
                <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block truncate leading-tight">{label}</span>
                <span className="block truncate text-[9px] font-normal text-red-100/90 leading-tight">
                  {desc}
                </span>
              </div>
            </div>

            {isSubActive && (
              <span className="h-2 w-2 rounded-full bg-white shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

interface AdminSidebarNavProps {
  variant?: "sidebar" | "mobile";
}

export function AdminSidebarNav({ variant = "sidebar" }: AdminSidebarNavProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <>
        {ADMIN_MENU_ITEMS.map(({ href, mobileLabel, Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-all ${
                isActive
                  ? "bg-[#990000] ring-2 ring-[#DC0000]/35 shadow-sm"
                  : "bg-[#DC0000] hover:bg-[#b80000] shadow-2xs"
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-white shrink-0" />
              <span>{mobileLabel}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {ADMIN_MENU_ITEMS.map(({ href, label, Icon, hasSubMenu }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <div key={href} className="w-full">
            <Link
              href={href}
              className={`group relative flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all select-none ${
                isActive
                  ? "bg-[#990000] ring-2 ring-[#DC0000]/35 shadow-[0_6px_16px_rgba(180,0,0,0.32)]"
                  : "bg-[#DC0000] hover:bg-[#b80000] shadow-[0_3px_10px_rgba(220,0,0,0.2)] hover:shadow-[0_5px_14px_rgba(220,0,0,0.3)] hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-white text-[#DC0000] shadow-2xs"
                      : "bg-white/15 text-white group-hover:bg-white/25"
                  }`}
                >
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <span className="truncate tracking-tight">{label}</span>
              </div>

              {hasSubMenu ? (
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? "text-white" : "text-white/80"
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive
                      ? "text-white translate-x-0.5"
                      : "text-white/70 group-hover:text-white group-hover:translate-x-0.5"
                  }`}
                />
              )}
            </Link>

            {hasSubMenu && (
              <Suspense fallback={null}>
                <AnalyticsSubMenuList isAnalyticsPath={isActive} />
              </Suspense>
            )}
          </div>
        );
      })}
    </div>
  );
}
