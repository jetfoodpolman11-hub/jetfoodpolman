import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCourier } from "@/lib/auth/guards";
import { getDailyReportById } from "@/actions/daily-reports";
import { getPackageTypes } from "@/actions/package-types";
import { getProvinces } from "@/actions/regions";
import { getWitaDateString } from "@/lib/date";
import { DailyReportForm } from "@/components/courier/daily-report-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit3, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Edit Laporan Operasional — JetFood Polman",
};

export default async function CourierEditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCourier();
  const { id } = await params;

  const report = await getDailyReportById(id);
  if (!report) {
    notFound();
  }

  // Check editing rule: Courier can only edit on current calendar day
  if (!report.isEditableByCourier) {
    return (
      <div className="space-y-4">
        <div>
          <Link
            href="/courier/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Riwayat Laporan</span>
          </Link>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
            <h2 className="text-base font-bold text-amber-900">
              Laporan Terkunci untuk Pengeditan
            </h2>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Laporan operasional pada tanggal lampau ({report.date}) telah terkunci secara permanen untuk integritas histori akuntansi. Hubungi Admin apabila membutuhkan koreksi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayWita = getWitaDateString(new Date());

  const [activePackageTypes, provinces] = await Promise.all([
    getPackageTypes({ activeOnly: true }),
    getProvinces(),
  ]);

  return (
    <div className="space-y-5">
      {/* Back Link */}
      <div>
        <Link
          href="/courier/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Riwayat Laporan</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="rounded-2xl bg-[#DC0000] p-5 text-white shadow-[0_6px_18px_rgba(220,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-white shrink-0" />
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
            Perbarui Laporan Operasional
          </h1>
        </div>
        <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
          Koreksi rute, jumlah order paket, omset, atau catatan untuk tanggal {report.date}.
        </p>
      </div>

      {/* Interactive Form */}
      <DailyReportForm
        provinces={provinces}
        packageTypes={activePackageTypes}
        todayWita={todayWita}
        initialData={report}
        isEditing
      />
    </div>
  );
}
