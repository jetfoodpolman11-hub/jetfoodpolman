import { requireAdmin } from "@/lib/auth/guards";
import { getAdminAttendanceList } from "@/actions/attendance";
import { getCouriers } from "@/actions/couriers";
import { AttendanceFilter } from "@/components/admin/attendance-filter";
import { AttendanceTable } from "@/components/admin/attendance-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Users, CheckCircle2, Clock } from "lucide-react";
import { getWitaDateString, formatWitaDateFull } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Presensi Kurir — JetFood Polman",
};

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; courierId?: string }>;
}) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const todayWita = getWitaDateString(new Date());
  const selectedDate = params.date || todayWita;
  const selectedCourierId = params.courierId || "ALL";

  const [couriers, records] = await Promise.all([
    getCouriers(),
    getAdminAttendanceList({
      date: selectedDate,
      courierId: selectedCourierId,
    }),
  ]);

  const courierOptions = couriers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    courierCode: c.courierCode,
  }));

  // If in placeholder environment and no couriers exist in db, provide fallback options
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

  // Metrics computation for selected date
  const totalPresent = records.length;
  const completedClockOut = records.filter((r) => !!r.clockOutTime).length;
  const inField = records.filter((r) => !r.clockOutTime).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-orange-600" />
            Monitoring Presensi Kurir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau kehadiran, waktu mulai tugas, kepulangan, serta koreksi manual presensi kurir lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-xs font-bold px-3 py-1">
            {formatWitaDateFull(selectedDate)} (WITA)
          </Badge>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Hadir */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-500">
              Presensi Masuk
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{totalPresent}</span>
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Users className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Total kurir tercatat hadir pada tanggal ini
            </span>
          </CardContent>
        </Card>

        {/* Sedang Bertugas */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-600">
              Sedang Bertugas di Lapangan
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{inField}</span>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Sudah masuk &amp; belum melakukan absen pulang
            </span>
          </CardContent>
        </Card>

        {/* Selesai Pulang */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-600">
              Selesai Pulang (Checkout)
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{completedClockOut}</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Presensi masuk &amp; pulang lengkap
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <AttendanceFilter
        couriers={finalCourierOptions}
        currentDate={selectedDate}
        currentCourierId={selectedCourierId}
      />

      {/* Attendance Interactive Table */}
      <AttendanceTable records={records} />
    </div>
  );
}
