import { requireCourier } from "@/lib/auth/guards";
import { getPackageTypes } from "@/actions/package-types";
import { getProvinces } from "@/actions/regions";
import { getWitaDateString, formatWitaDateFull } from "@/lib/date";
import { DailyReportForm } from "@/components/courier/daily-report-form";
import { FilePlus } from "lucide-react";

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
    <div className="space-y-5 pb-8 font-sans">
      {/* Top Curved Red Hero Banner (Merged with Header) */}
      <div className="-mx-4 -mt-6 bg-[#DC0000] rounded-b-[40px] px-5 pt-7 pb-8 text-white shadow-[0_8px_24px_rgba(220,0,0,0.22)] sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FilePlus className="h-5 w-5 text-white shrink-0" />
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug">
              Input Laporan Operasional Harian
            </h1>
          </div>
          <span className="text-xs font-bold text-white/95 text-right shrink-0">
            {todayFormatted} (WITA)
          </span>
        </div>
        <p className="text-xs text-white/90 mt-2 leading-relaxed">
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
