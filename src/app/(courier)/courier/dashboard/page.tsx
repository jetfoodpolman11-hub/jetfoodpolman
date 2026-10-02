import { getCurrentSession } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, FilePlus, ChevronRight, CheckCircle2 } from "lucide-react";
import { formatWitaDateFull } from "@/lib/date";

export default async function CourierDashboardPage() {
  const session = await getCurrentSession();
  const todayWita = formatWitaDateFull(new Date());

  return (
    <div className="space-y-5">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-5 text-white shadow-sm">
        <span className="text-xs uppercase tracking-wider text-orange-100 font-semibold block">
          {todayWita}
        </span>
        <h1 className="text-xl font-bold mt-1">
          Halo, {session?.profile?.fullName || "Kurir"}!
        </h1>
        <p className="text-xs text-orange-100 mt-1">
          Kode Kurir: <span className="font-semibold text-white">{session?.courier?.courierCode || "JF-KURIR"}</span>
        </p>
      </div>

      {/* Attendance Status Card (Preview) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Presensi Hari Ini</CardTitle>
            <Badge variant="warning">Belum Absen</Badge>
          </div>
          <CardDescription className="text-xs">
            Pastikan absen masuk sebelum memulai pengantaran paket operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/courier/attendance"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Clock className="h-4 w-4" />
            Absen Sekarang
          </Link>
        </CardContent>
      </Card>

      {/* Quick Action: Input Laporan */}
      <Card className="hover:border-orange-200 transition-colors">
        <Link
          href="/courier/reports/new"
          className="flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Input Laporan Harian</h2>
              <p className="text-xs text-slate-500">
                Catat rute, jumlah order, omset, ojol & jastip
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </Card>

      {/* Security & Access Isolation Note */}
      <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500 flex items-start gap-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <span>
          Akses Kurir Terproteksi: Data operasional dan riwayat Anda terisolasi secara aman menggunakan Row Level Security (RLS).
        </span>
      </div>
    </div>
  );
}
