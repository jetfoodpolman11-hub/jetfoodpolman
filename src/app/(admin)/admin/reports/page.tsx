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
  }>;
}) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const selectedDate = params.date || "";
  const selectedCourierId = params.courierId || "ALL";
  const selectedPackageTypeId = params.packageTypeId || "ALL";
  const selectedRouteQuery = params.routeQuery || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [couriers, packageTypes, paginatedData] = await Promise.all([
    getCouriers(),
    getPackageTypes(),
    getAdminDailyReports({
      date: selectedDate,
      courierId: selectedCourierId,
      packageTypeId: selectedPackageTypeId,
      routeQuery: selectedRouteQuery,
      page: currentPage,
      perPage: 10,
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
            Pantau seluruh laporan harian kurir, rute pengantaran, omset, pesanan ojol, dan jastip secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="text-xs font-semibold px-3 py-1 bg-white">
            Total {total} Laporan Terdata
          </Badge>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Laporan */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Total Laporan
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{summary.totalReports}</span>
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <FileText className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">
              Laporan terverifikasi sistem
            </span>
          </CardContent>
        </Card>

        {/* Total Order Paket */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-600">
              Volume Order Paket
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{summary.totalOrders}</span>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">
              Total paket diantarkan kurir
            </span>
          </CardContent>
        </Card>

        {/* Total Omset */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-600">
              Akumulasi Omset
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <span className="text-emerald-700">{formatRupiah(summary.totalOmset)}</span>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">
              Pendapatan operasional kurir
            </span>
          </CardContent>
        </Card>

        {/* Total Ojol & Jastip */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-purple-600">
              Ojol &amp; Jastip
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{summary.totalOjolCount + summary.totalJastipCount}</span>
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Bike className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">
              Total {formatRupiah(summary.totalOjolAmount + summary.totalJastipAmount)}
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

      {/* Reports Table with Server-Side Pagination */}
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
