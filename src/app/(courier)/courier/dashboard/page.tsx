import Link from "next/link";
import { getCourierDashboardData } from "@/actions/courier-dashboard";
import {
  Clock,
  ArrowRight,
  Package,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Truck,
  MapPin,
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

  const isBelumAbsen = data.attendance.status === "BELUM_ABSEN";
  const isSudahMasuk = data.attendance.status === "SUDAH_MASUK";
  const isSudahPulang = data.attendance.status === "SUDAH_PULANG";

  return (
    <div className="space-y-5 pb-8 font-sans">
      {/* 1. TOP CURVED DARK HERO CARD (Aesthetic inspired by mobile delivery design) */}
      <div className="rounded-3xl bg-slate-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* Avatar circle with red border ring */}
            <div className="h-12 w-12 rounded-full border-2 border-red-600 p-0.5 bg-slate-900 flex items-center justify-center shrink-0 shadow-md">
              <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-red-500 font-black text-lg">
                {data.courierName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 block tracking-wide uppercase">
                Kurir Lapangan
              </span>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                Halo, {data.courierName}! 👋
              </h1>
              <span className="text-[11px] font-mono text-red-400 font-bold">
                {data.courierCode} {data.plateNumber ? `• ${data.plateNumber}` : ""}
              </span>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="text-right">
            {isBelumAbsen && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Belum Absen</span>
              </span>
            )}
            {isSudahMasuk && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aktif Bertugas</span>
              </span>
            )}
            {isSudahPulang && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                <CheckCircle2 className="h-3 w-3 text-blue-400" />
                <span>Selesai Pulang</span>
              </span>
            )}
          </div>
        </div>

        {/* Date & Polman Location Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            <span>Kabupaten Polewali Mandar (WITA)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {data.todayDateFormatted}
          </span>
        </div>

        {/* Quick Action Buttons inside Dark Container */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {/* Action 1: Presensi Button */}
          {isBelumAbsen && (
            <Link
              href="/courier/attendance"
              className="h-11 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md"
            >
              <Clock className="h-4 w-4" />
              <span>Absen Masuk Sekarang</span>
            </Link>
          )}

          {isSudahMasuk && (
            <Link
              href="/courier/attendance"
              className="h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white flex items-center justify-center gap-2 text-xs font-bold transition-all border border-slate-700 shadow-md"
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Absen Pulang (Selesai)</span>
            </Link>
          )}

          {isSudahPulang && (
            <Link
              href="/courier/attendance"
              className="h-11 rounded-2xl bg-slate-800/90 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 text-xs font-bold transition-all border border-slate-700"
            >
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span>Presensi Selesai</span>
            </Link>
          )}

          {/* Action 2: Input Laporan Harian */}
          <Link
            href="/courier/reports/new"
            className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 flex items-center justify-center gap-2 text-xs font-black transition-all shadow-md"
          >
            <Plus className="h-4 w-4 text-red-600" />
            <span>Input Laporan Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. TODAY'S SUMMARY METRIC CARDS (White modern cards) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Order Hari Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Order Hari Ini
            </span>
            <div className="h-6 w-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatNumber(data.todayStats.totalOrders)}{" "}
            <span className="text-xs font-semibold text-slate-400">paket</span>
          </div>
          <span className="text-[11px] text-slate-500 block truncate">
            Dari {data.todayStats.reportCount} rute perjalanan
          </span>
        </div>

        {/* Omset Hari Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Omset Hari Ini
            </span>
            <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatRupiah(data.todayStats.totalOmset)}
          </div>
          <span className="text-[11px] text-slate-500 block truncate">
            Tercatat resmi di Polman
          </span>
        </div>
      </div>

      {/* 3. ACTIVE DELIVERIES & TODAY'S ROUTES (Styled like mockup cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-red-600" />
            <span>Pengantaran &amp; Rute Hari Ini</span>
          </h2>
          <Link
            href="/courier/history"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.recentReports.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-white border border-slate-200 p-6 space-y-2.5 shadow-2xs">
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
          <div className="space-y-3">
            {data.recentReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-3"
              >
                {/* Header: Package Badge & Timestamp */}
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {report.packageName}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {report.createdAtFormatted}
                  </span>
                </div>

                {/* Visual Route Indicator (Inspired by reference mockup dot-line-dot) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2.5">
                    {/* Departure Node */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="h-3 w-3 rounded-full border-2 border-red-600 bg-white shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                          Asal
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {report.originDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Arrow / Connecting line */}
                    <div className="text-slate-400 shrink-0 px-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>

                    {/* Destination Node */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="h-3 w-3 rounded-full bg-slate-900 shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                          Tujuan
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
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
