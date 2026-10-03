import Link from "next/link";
import { requireCourier } from "@/lib/auth/guards";
import { getCourierDailyReports } from "@/actions/daily-reports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { formatWitaDateFull } from "@/lib/date";
import {
  History,
  FilePlus,
  Package,
  TrendingUp,
  Calendar,
  Edit3,
  AlertCircle,
  Bike,
  ShoppingBag,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Riwayat Operasional — JetFood Polman",
};

export default async function CourierHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  await requireCourier();
  const params = (await searchParams) || {};
  const selectedDate = params.date || undefined;

  const reports = await getCourierDailyReports({ date: selectedDate });

  // Summary Metrics Calculation
  const totalReports = reports.length;
  const totalOrders = reports.reduce((acc, r) => acc + r.orderCount, 0);
  const totalOmset = reports.reduce((acc, r) => acc + r.omset, 0);

  return (
    <div className="space-y-5 pb-8 font-sans">
      {/* Top Curved Red Hero Banner (Merged with Header) */}
      <div className="-mx-4 -mt-6 bg-[#DC0000] rounded-b-[40px] px-5 pt-7 pb-8 text-white shadow-[0_8px_24px_rgba(220,0,0,0.22)] sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-7">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-white shrink-0" />
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Riwayat Operasional Saya
            </h1>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white whitespace-nowrap">
            {totalReports} Laporan
          </span>
        </div>
        <p className="text-xs text-white/90 mt-2 leading-relaxed">
          Arsip seluruh laporan rute, jumlah order paket, dan omset yang Anda kirimkan.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Rute
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatNumber(totalReports)}
            </div>
            <span className="text-[10px] text-slate-500 block">pengiriman</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
              <Package className="h-3 w-3 text-red-600" />
              <span>Order</span>
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatNumber(totalOrders)}
            </div>
            <span className="text-[10px] text-slate-500 block">paket</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span>Omset</span>
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {formatRupiah(totalOmset)}
            </div>
            <span className="text-[10px] text-slate-500 block">total</span>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter Bar */}
      <form
        action="/courier/history"
        method="GET"
        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="date"
            name="date"
            defaultValue={selectedDate || ""}
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#DC0000] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Filter
        </button>
        {selectedDate && (
          <Link
            href="/courier/history"
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Semua
          </Link>
        )}
      </form>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                Belum ada laporan operasional
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {selectedDate
                  ? `Tidak ada laporan yang tercatat pada tanggal ${selectedDate}.`
                  : "Anda belum mengirimkan laporan harian. Mulai catat rute pengantaran pertama Anda."}
              </p>
              <div className="pt-2">
                <Link
                  href="/courier/reports/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                >
                  <FilePlus className="h-4 w-4" />
                  <span>Input Laporan Sekarang</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card
              key={report.id}
              className="border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                {/* Header: Date & Package */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatWitaDateFull(report.date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] font-bold">
                      {report.packageTypeName}
                    </Badge>
                    {report.isEditableByCourier && (
                      <Link
                        href={`/courier/reports/${report.id}/edit`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
                    Rute Perjalanan
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 leading-snug">
                    {report.routeDisplay}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Jumlah Order
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {report.orderCount} paket
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Omset
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      {formatRupiah(report.omset)}
                    </span>
                  </div>

                  {report.ojolCount > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                        <Bike className="h-2.5 w-2.5 text-red-500" />
                        <span>Ojol</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {report.ojolCount} trip ({formatRupiah(report.ojolAmount)})
                      </span>
                    </div>
                  )}

                  {report.jastipCount > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                        <ShoppingBag className="h-2.5 w-2.5 text-blue-500" />
                        <span>Jastip</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {report.jastipCount} item ({formatRupiah(report.jastipAmount)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1 text-[11px] text-slate-400 border-t border-slate-50">
                  {report.notes ? (
                    <span className="italic text-slate-600 truncate max-w-sm" title={report.notes}>
                      Catatan: &quot;{report.notes}&quot;
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                  <span className="text-[10px] text-slate-400 shrink-0">
                    Dikirim: {report.createdAtFormatted}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
