import Link from "next/link";
import { getCourierDashboardData } from "@/actions/courier-dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FilePlus,
  ArrowRight,
  Package,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  History,
  AlertCircle,
  Truck,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Dashboard Kurir — JetFood Polman",
};

export default async function CourierDashboardPage() {
  const data = await getCourierDashboardData();

  const isBelumAbsen = data.attendance.status === "BELUM_ABSEN";
  const isSudahMasuk = data.attendance.status === "SUDAH_MASUK";
  const isSudahPulang = data.attendance.status === "SUDAH_PULANG";

  return (
    <div className="space-y-5">
      {/* 1. Greeting Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">
            {data.todayDateFormatted}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
            {data.courierCode}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold mt-1.5 leading-tight">
          Halo, {data.courierName}!
        </h1>

        <div className="flex items-center gap-2 mt-2 text-xs text-orange-100">
          <Truck className="h-3.5 w-3.5" />
          <span>
            {data.vehicleType || "Sepeda Motor"}{" "}
            {data.plateNumber && `• ${data.plateNumber}`}
          </span>
        </div>
      </div>

      {/* 2. Today's Attendance Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-base">Presensi Hari Ini</CardTitle>
            </div>

            {isBelumAbsen && (
              <Badge variant="danger" className="font-bold">
                Belum Absen
              </Badge>
            )}
            {isSudahMasuk && (
              <Badge variant="success" className="font-bold">
                Sudah Absen Masuk
              </Badge>
            )}
            {isSudahPulang && (
              <Badge variant="info" className="font-bold">
                Selesai (Pulang)
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Pencatatan waktu resmi presensi wilayah Polewali Mandar (WITA).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Time Stamps Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Waktu Masuk
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
                {data.attendance.clockInTime || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Waktu Pulang
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
                {data.attendance.clockOutTime || "—"}
              </span>
            </div>
          </div>

          {/* Context-aware Absen Action Button */}
          {isBelumAbsen && (
            <Link
              href="/courier/attendance"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span>Absen Masuk Sekarang</span>
            </Link>
          )}

          {isSudahMasuk && (
            <Link
              href="/courier/attendance"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span>Absen Pulang</span>
            </Link>
          )}

          {isSudahPulang && (
            <div className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Presensi Masuk & Pulang Lengkap</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Primary Quick Action: Input Laporan Operasional */}
      <Link
        href="/courier/reports/new"
        className="block group"
      >
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50/70 to-amber-50/40 hover:border-orange-300 transition-all shadow-xs cursor-pointer">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <FilePlus className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 block leading-tight">
                  Input Laporan Harian
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Catat rute keberangkatan, tujuan, order & omset
                </span>
              </div>
            </div>

            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-2xs group-hover:translate-x-1 transition-transform">
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Today's Summary Metrics for This Courier */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Order Hari Ini
              </span>
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatNumber(data.todayStats.totalOrders)}{" "}
              <span className="text-xs font-semibold text-slate-400">paket</span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Dari {data.todayStats.reportCount} rute perjalanan
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Omset Hari Ini
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
              {formatRupiah(data.todayStats.totalOmset)}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Tercatat pada sistem
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 5. Laporan Terbaru (Recent Reports) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-slate-700" />
              Laporan Terbaru Saya
            </CardTitle>
            <Link
              href="/courier/history"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Lihat Semua &rarr;
            </Link>
          </div>
          <CardDescription className="text-xs">
            Aktivitas pengantaran terakhir yang Anda kirimkan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {data.recentReports.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <AlertCircle className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Belum ada laporan operasional yang diinput hari ini.
              </p>
              <Link
                href="/courier/reports/new"
                className="inline-flex text-xs font-semibold text-orange-600 hover:underline"
              >
                Mulai input laporan pertama &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 leading-snug">
                      {report.routeDisplay}
                    </span>
                    <Badge variant="neutral" className="text-[10px] shrink-0 font-semibold">
                      {report.packageName}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <span>
                        <strong className="text-slate-800">{report.orderCount}</strong> order
                      </span>
                      <span>
                        <strong className="text-emerald-700">{formatRupiah(report.omset)}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {report.createdAtFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
