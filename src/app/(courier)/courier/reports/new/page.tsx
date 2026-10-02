import Link from "next/link";
import { requireCourier } from "@/lib/auth/guards";
import { getPackageTypes } from "@/actions/package-types";
import { getProvinces } from "@/actions/regions";
import { getWitaDateString, formatWitaDateFull } from "@/lib/date";
import { DailyReportForm } from "@/components/courier/daily-report-form";
import { ArrowLeft, FilePlus } from "lucide-react";

export const metadata = {
  title: "Input Laporan Operasional — JetFood Polman",
};

export default async function CourierNewReportPage() {
  await requireCourier();

  const todayWita = getWitaDateString(new Date());
  const todayFormatted = formatWitaDateFull(new Date());

  const [activePackageTypes, provinces] = await Promise.all([
    getPackageTypes({ activeOnly: true }),
    getProvinces(),
  ]);

  return (
    <div className="space-y-5">
      {/* Back Link */}
      <div>
        <Link
          href="/courier/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-orange-400" />
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
              Input Laporan Operasional Harian
            </h1>
          </div>
          <span className="text-xs font-semibold text-orange-300">
            {todayFormatted} (WITA)
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Catat rute keberangkatan, tujuan pengantaran, jumlah order, dan omset harian Anda di lapangan.
        </p>
      </div>

      {/* Interactive Report Form */}
      <DailyReportForm
        provinces={provinces}
        packageTypes={activePackageTypes}
        todayWita={todayWita}
      />
    </div>
  );
}
