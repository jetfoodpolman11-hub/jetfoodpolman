import { requireAdmin } from "@/lib/auth/guards";
import { getAdminDailyReports } from "@/actions/daily-reports";
import { getCouriers } from "@/actions/couriers";
import { getPackageTypes } from "@/actions/package-types";
import { ReportFilter } from "@/components/admin/report-filter";
import { ReportTable } from "@/components/admin/report-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Package,
  Banknote,
  Bike,
  ShoppingBag,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Laporan Operasional — JetFood Polman",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    date?: string;
    courierId?: string;
    packageTypeId?: string;
    routeQuery?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const selectedDate = params.date || "";
  const selectedCourierId = params.courierId || "ALL";
  const selectedPackageTypeId = params.packageTypeId || "ALL";
  const selectedRouteQuery = params.routeQuery || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const rawPerPage = (params.perPage || "10").trim().toUpperCase();
  const requestedPerPage =
    rawPerPage === "ALL"
      ? 5000
      : Math.max(1, Math.min(5000, parseInt(rawPerPage, 10) || 10));

  const [couriers, packageTypes, paginatedData] = await Promise.all([
    getCouriers(),
    getPackageTypes(),
    getAdminDailyReports({
      date: selectedDate,
      courierId: selectedCourierId,
      packageTypeId: selectedPackageTypeId,
      routeQuery: selectedRouteQuery,
      page: currentPage,
      perPage: requestedPerPage,
    }),
  ]);

  const courierOptions = couriers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    courierCode: c.courierCode,
  }));

  const finalCourierOptions =
    courierOptions.length > 0
      ? courierOptions
      : [
          {
            id: "mock-courier-rec-id",
            fullName: "Kurir Lapangan Ali",
            courierCode: "JF-001",
          },
        ];

  const packageTypeOptions = packageTypes.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const { summary, reports, total, page, totalPages, perPage } = paginatedData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-600" />
            Monitoring Laporan Operasional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau seluruh laporan harian kurir, rincian tiap fitur layanan (Paket, Jastip, Ojol, Langsung, Random), serta akumulasi omset secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="text-xs font-semibold px-3 py-1 bg-white">
            Total {total} Laporan Terdata
          </Badge>
        </div>
      </div>

      {/* 7 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Laporan (Keseluruhan) */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-600">
              Total Laporan (Keseluruhan)
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span>{summary.totalReports}</span>
                <span className="text-xs font-semibold text-slate-500">Laporan</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center text-[#DC0000]">
                <FileText className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-medium text-slate-500">
              Total <span className="font-bold text-slate-800">{summary.totalOrders} order</span> dari seluruh layanan
            </span>
          </CardContent>
        </Card>

        {/* 2. Paket */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-blue-600">
              Paket
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span>{summary.byFeature.paket.reportCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Laporan ({summary.byFeature.paket.orders} Order)
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-semibold text-slate-600">
              Omset: <span className="font-bold text-emerald-700">{formatRupiah(summary.byFeature.paket.omset)}</span>
            </span>
          </CardContent>
        </Card>

        {/* 3. Jastip */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-purple-600">
              Jastip
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span>{summary.byFeature.jastip.reportCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Laporan ({summary.byFeature.jastip.orders} Order)
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-semibold text-slate-600">
              Omset: <span className="font-bold text-emerald-700">{formatRupiah(summary.byFeature.jastip.omset)}</span>
            </span>
          </CardContent>
        </Card>

        {/* 4. Ojol */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-sky-600">
              Ojol
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span>{summary.byFeature.ojol.reportCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Laporan ({summary.byFeature.ojol.orders} Order)
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Bike className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-semibold text-slate-600">
              Omset: <span className="font-bold text-emerald-700">{formatRupiah(summary.byFeature.ojol.omset)}</span>
            </span>
          </CardContent>
        </Card>

        {/* 5. Langsung */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-amber-600">
              Langsung
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span>{summary.byFeature.langsung.reportCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Laporan ({summary.byFeature.langsung.orders} Order)
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-semibold text-slate-600">
              Omset: <span className="font-bold text-emerald-700">{formatRupiah(summary.byFeature.langsung.omset)}</span>
            </span>
          </CardContent>
        </Card>

        {/* 6. Random */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-pink-600">
              Random
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span>{summary.byFeature.random.reportCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Laporan ({summary.byFeature.random.orders} Order)
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-semibold text-slate-600">
              Omset: <span className="font-bold text-emerald-700">{formatRupiah(summary.byFeature.random.omset)}</span>
            </span>
          </CardContent>
        </Card>

        {/* 7. Total Omset (Keseluruhan) */}
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-xs sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-emerald-700">
              Total Omset (Keseluruhan)
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span className="text-emerald-700">{formatRupiah(summary.totalOmset)}</span>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Banknote className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] font-medium text-slate-600">
              Akumulasi pendapatan keseluruhan dari <span className="font-bold text-slate-800">{summary.totalReports} laporan</span> ({summary.totalOrders} order)
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Component */}
      <ReportFilter
        couriers={finalCourierOptions}
        packageTypes={packageTypeOptions}
        currentDate={selectedDate}
        currentCourierId={selectedCourierId}
        currentPackageTypeId={selectedPackageTypeId}
        currentRouteQuery={selectedRouteQuery}
      />

      {/* Reports Table with Server-Side Pagination & Lihat Semua Baris Option */}
      <ReportTable
        reports={reports}
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
      />
    </div>
  );
}
