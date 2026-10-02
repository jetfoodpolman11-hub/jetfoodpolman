import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Presensi Kurir — JetFood Polman",
};

export default function CourierAttendancePage() {
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
            <Clock className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Presensi Kurir (WITA)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Modul sistem presensi masuk dan pulang lengkap akan diaktifkan pada Phase 6.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            Pencatatan jam masuk & jam pulang otomatis tersinkronisasi dengan zona waktu Asia/Makassar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
