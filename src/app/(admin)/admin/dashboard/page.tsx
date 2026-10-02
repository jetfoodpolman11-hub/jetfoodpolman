import Link from "next/link";
import { getAdminDashboardStats } from "@/actions/admin-dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, CalendarCheck, Clock, ArrowRight } from "lucide-react";
import { formatWitaDateFull } from "@/lib/date";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const todayFormatted = formatWitaDateFull(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ringkasan status operasional harian kurir JetFood Polman.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">{todayFormatted} (WITA)</Badge>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kurir */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Total Kurir
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{stats.totalCouriers}</span>
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Semua akun kurir terdaftar di sistem
            </span>
          </CardContent>
        </Card>

        {/* Kurir Aktif */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-600">
              Kurir Aktif
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{stats.activeCouriers}</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Siap bertugas di lapangan
            </span>
          </CardContent>
        </Card>

        {/* Hadir Hari Ini */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-600">
              Hadir Hari Ini
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{stats.presentToday}</span>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Sudah melakukan absen masuk
            </span>
          </CardContent>
        </Card>

        {/* Belum Absen */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-600">
              Belum Absen
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{stats.notPresentToday}</span>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Kurir aktif belum presensi hari ini
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Card */}
      <Card className="border-orange-100 bg-gradient-to-r from-orange-50/50 to-white shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Kelola Data Kurir Lapangan
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tambah kurir baru, perbarui data operasional, kelola status aktif/nonaktif, dan reset kredensial.
            </p>
          </div>
          <Link
            href="/admin/couriers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-xs"
          >
            <span>Buka Manajemen Kurir</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
