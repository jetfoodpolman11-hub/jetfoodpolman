import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FilePlus, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Input Laporan Operasional — JetFood Polman",
};

export default function CourierNewReportPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/courier/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Beranda
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Input Laporan Operasional</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Form pencatatan rute, jumlah order, omset, ojol, dan jastip akan diaktifkan pada Phase 7.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            Formulir laporan akan terintegrasi langsung dengan pemilih rute bertingkat dan master jenis paket.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
