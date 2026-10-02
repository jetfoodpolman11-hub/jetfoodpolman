import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { History, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Riwayat Kurir — JetFood Polman",
};

export default function CourierHistoryPage() {
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
            <History className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Riwayat Operasional Saya</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Daftar lengkap riwayat presensi dan laporan operasional pribadi kurir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            Riwayat diarsipkan aman dengan filter tanggal operasional harian.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
