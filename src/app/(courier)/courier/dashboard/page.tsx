import Link from "next/link";
import Image from "next/image";
import { getCourierDashboardData } from "@/actions/courier-dashboard";
import {
  ArrowRight,
  Package,
  TrendingUp,
  AlertCircle,
  Truck,
  ChevronRight,
  Plus,
  Bike,
  ShoppingBag,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { BiometricCard } from "@/components/courier/biometric-card";

export const metadata = {
  title: "Dashboard Kurir — JetFood Polman",
  description: "Pusat operasional harian kurir JetFood Polewali Mandar",
};

export default async function CourierDashboardPage() {
  const data = await getCourierDashboardData();

  const greetingName =
    data.courierName
      .replace(/^kurir(\s+lapangan)?\s+/i, "")
      .trim() || "Kurir";

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* 1. TOP CURVED RED HERO BANNER (Matches reference mockup 1:1) */}
      <div className="-mx-4 -mt-6 bg-[#DC0000] rounded-b-[44px] px-7 pt-9 pb-12 text-white shadow-xs sm:mx-0 sm:mt-0 sm:rounded-3xl">
        <div className="flex items-center gap-5">
          {/* Circular Courier Portrait Avatar */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden shrink-0 shadow-md">
            <Image
              src="/images/courier-avatar.png"
              alt={greetingName}
              width={112}
              height={112}
              className="h-full w-full object-cover scale-[1.03]"
              priority
            />
          </div>

          {/* Greeting Text */}
          <div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white/95 block">
              KURIR JETFOOD
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none mt-1.5">
              Halo {greetingName}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Order Hari Ini */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
              ORDER HARI INI
            </span>
            <div className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            {formatNumber(data.todayStats.totalOrders)}{" "}
            <span className="text-sm font-bold text-slate-400">paket</span>
          </div>
          <span className="text-xs text-slate-400 font-medium block truncate">
            Dari {data.todayStats.reportCount} rute perjalanan
          </span>
        </div>

        {/* Omset Hari Ini */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
              OMSET HARI INI
            </span>
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight truncate">
            {formatRupiah(data.todayStats.totalOmset)}
          </div>
          <span className="text-xs text-slate-400 font-medium block truncate">
            Tercatat resmi di Polman
          </span>
        </div>
      </div>

      {/* 3. PENGANTARAN & RUTE HARI INI */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 flex items-center gap-2">
            <Truck className="h-4 w-4 text-red-600" />
            <span>PENGANTARAN &amp; RUTE HARI INI</span>
          </h2>
          <Link
            href="/courier/history"
            className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentReports.length === 0 ? (
          <div className="py-8 text-center rounded-3xl bg-white border border-slate-200/80 p-6 space-y-2.5 shadow-2xs">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              Belum ada laporan pengantaran yang diinput hari ini.
            </p>
            <Link
              href="/courier/reports/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Mulai Input Laporan Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.recentReports.map((report) => (
              <div
                key={report.id}
                className="p-4 sm:p-5 rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-3.5"
              >
                {/* Header: Package Badge & Timestamp */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-red-50 text-red-700 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                    {report.packageName}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {report.createdAtFormatted}
                  </span>
                </div>

                {/* Visual Route Indicator (Dot -> Arrow -> Dot) */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100/80">
                  <div className="flex items-center gap-2.5">
                    {/* Departure Node */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="h-3.5 w-3.5 rounded-full border-[3px] border-red-600 bg-white shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-tight">
                          ASAL
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase truncate block mt-0.5">
                          {report.originDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-slate-400 shrink-0 px-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>

                    {/* Destination Node */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="h-3.5 w-3.5 rounded-full bg-slate-950 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-tight">
                          TUJUAN
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase truncate block mt-0.5">
                          {report.destDisplay}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{report.orderCount}</strong> order paket
                    </span>
                    {report.ojolCount > 0 && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Bike className="h-3 w-3 text-red-600" />
                        <span>{report.ojolCount} trip</span>
                      </span>
                    )}
                    {report.jastipCount > 0 && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <ShoppingBag className="h-3 w-3 text-blue-600" />
                        <span>{report.jastipCount} jastip</span>
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-emerald-700">
                    {formatRupiah(report.omset)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SENSOR SIDIK JARI (BIOMETRIK HP) CARD */}
      <BiometricCard courierCode={data.courierCode} courierName={data.courierName} />
    </div>
  );
}
