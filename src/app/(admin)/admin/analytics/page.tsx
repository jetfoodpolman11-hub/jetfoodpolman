import { requireAdmin } from "@/lib/auth/guards";
import { getOperationalAnalytics } from "@/actions/analytics";
import { AnalyticsPeriodFilter } from "@/components/admin/analytics-period-filter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Banknote,
  Bike,
  ShoppingBag,
  Users,
  FileText,
  MapPin,
  ArrowRight,
  BarChart3,
  Info,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rekap Operasional & Analitik — JetFood Polman",
  description: "Pusat rekapitulasi faktual operasional kurir, rute, dan omset JetFood Polman",
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const data = await getOperationalAnalytics({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const { summary, courierRecap, routeRecap } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-red-600" />
            <span>Rekap Operasional &amp; Analitik</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi data faktual operasional harian, kehadiran kurir, dan distribusi rute di Kabupaten Polewali Mandar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{data.periodLabel}</Badge>
        </div>
      </div>

      {/* Period Filter Bar */}
      <AnalyticsPeriodFilter
        currentPeriod={data.period}
        startDate={data.startDate}
        endDate={data.endDate}
        periodLabel={data.periodLabel}
      />

      {/* 1. STATISTIK UTAMA (6 Required Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Order */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-500">
              Total Order
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalOrders)} paket</span>
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Total paket yang diantarkan pada periode terpilih
            </span>
          </CardContent>
        </Card>

        {/* 2. Total Omset */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-emerald-600">
              Total Omset
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatRupiah(summary.totalOmset)}</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Akumulasi nilai transaksi pengantaran paket
            </span>
          </CardContent>
        </Card>

        {/* 3. Total Ojol */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-orange-600">
              Total Ojol
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalOjolCount)} trip</span>
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Bike className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-slate-700">
              Nilai: {formatRupiah(summary.totalOjolAmount)}
            </span>
          </CardContent>
        </Card>

        {/* 4. Total Jastip */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-blue-600">
              Total Jastip
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalJastipCount)} order</span>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-slate-700">
              Nilai: {formatRupiah(summary.totalJastipAmount)}
            </span>
          </CardContent>
        </Card>

        {/* 5. Jumlah Kurir Hadir */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-indigo-600">
              Jumlah Kurir Hadir
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.presentCouriersCount)} kurir</span>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Total akumulasi kehadiran:{" "}
              <strong className="text-slate-700">{summary.totalAttendanceDays} hari kerja</strong>
            </span>
          </CardContent>
        </Card>

        {/* 6. Jumlah Laporan */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-600">
              Jumlah Laporan
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalReports)} laporan</span>
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Laporan operasional yang tercatat resmi di database
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 2. REKAP KURIR (Factual Data Only — No Ranking/Scoring) */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-red-600" />
                <span>Rekap Operasional per Kurir</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Data faktual kehadiran, order, omset, Ojol, dan Jastip masing-masing kurir (diurutkan netral berdasarkan Kode Kurir).
              </CardDescription>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span>Data Faktual Tanpa Ranking / Scoring</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Nama Kurir</th>
                  <th className="py-3 px-4 text-center">Jumlah Hari Hadir</th>
                  <th className="py-3 px-4 text-right">Total Order</th>
                  <th className="py-3 px-4 text-right">Total Omset</th>
                  <th className="py-3 px-4 text-right">Ojol</th>
                  <th className="py-3 px-4 text-right">Jastip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courierRecap.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada data kurir yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  courierRecap.map((c) => (
                    <tr key={c.courierId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md bg-slate-100 text-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold">
                            {c.courierCode}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {c.courierName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.reportCount} laporan tercatat
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {formatNumber(c.attendanceDays)} hari
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatNumber(c.totalOrders)} paket
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(c.totalOmset)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-900 block">
                          {formatNumber(c.ojolCount)} trip
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatRupiah(c.ojolAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-900 block">
                          {formatNumber(c.jastipCount)} order
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatRupiah(c.jastipAmount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {courierRecap.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td className="py-3 px-4">Total Akumulasi Periode</td>
                    <td className="py-3 px-4 text-center">
                      {formatNumber(summary.totalAttendanceDays)} hari kerja
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(summary.totalOrders)} paket
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatRupiah(summary.totalOmset)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(summary.totalOjolCount)} trip ({formatRupiah(summary.totalOjolAmount)})
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(summary.totalJastipCount)} order ({formatRupiah(summary.totalJastipAmount)})
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. REKAP RUTE */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span>Rekap Operasional per Rute Perjalanan</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Distribusi jumlah laporan, volume order paket, dan total omset berdasarkan pasangan wilayah keberangkatan dan tujuan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Rute (Wilayah Asal → Wilayah Tujuan)</th>
                  <th className="py-3 px-4 text-right">Jumlah Order</th>
                  <th className="py-3 px-4 text-right">Total Omset</th>
                  <th className="py-3 px-4 text-center">Jumlah Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routeRecap.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada laporan rute perjalanan pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  routeRecap.map((r) => (
                    <tr key={r.routeKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span>{r.originDisplay}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          <span>{r.destDisplay}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatNumber(r.totalOrders)} paket
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(r.totalOmset)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-bold">
                          {formatNumber(r.reportCount)} laporan
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {routeRecap.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td className="py-3 px-4">
                      Total ({routeRecap.length} Rute Aktif)
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(summary.totalOrders)} paket
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatRupiah(summary.totalOmset)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatNumber(summary.totalReports)} laporan
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
