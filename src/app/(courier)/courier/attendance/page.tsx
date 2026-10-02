import Link from "next/link";
import { requireCourier } from "@/lib/auth/guards";
import {
  getTodayAttendanceForCourier,
  getCourierAttendanceHistory,
} from "@/actions/attendance";
import { AttendanceCard } from "@/components/courier/attendance-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, Calendar, AlertCircle, MapPin } from "lucide-react";
import { formatWitaDateFull } from "@/lib/date";

export const metadata = {
  title: "Presensi Lapangan — JetFood Polman",
};

export default async function CourierAttendancePage() {
  const session = await requireCourier();
  const courierId = session.courier?.id || "";
  const courierName = session.profile?.fullName || "Kurir";

  const [todayState, history] = await Promise.all([
    getTodayAttendanceForCourier(courierId),
    getCourierAttendanceHistory(),
  ]);

  const todayDateFormatted = formatWitaDateFull(new Date());

  return (
    <div className="space-y-5">
      {/* Back to Dashboard Navigation */}
      <div>
        <Link
          href="/courier/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Primary Action: Today's Attendance Card */}
      <AttendanceCard
        initialState={todayState}
        todayDateFormatted={todayDateFormatted}
        courierName={courierName}
      />

      {/* Attendance History Section */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-700" />
              <CardTitle className="text-base">Riwayat Presensi Saya</CardTitle>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {history.length} Catatan
            </span>
          </div>
          <CardDescription className="text-xs">
            Log presensi masuk dan pulang Anda yang tercatat di server.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1.5">
              <AlertCircle className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Belum ada riwayat presensi yang tercatat.
              </p>
              <p className="text-[11px] text-slate-400">
                Lakukan absen masuk hari ini untuk memulai pencatatan.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((record) => {
                const isPulang = record.status === "PULANG";
                const hasAuditCorrection =
                  record.clockOutNotes &&
                  record.clockOutNotes.includes("[Koreksi Admin");

                return (
                  <div key={record.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900">
                          {formatWitaDateFull(record.date)}
                        </span>
                      </div>

                      {isPulang ? (
                        <Badge variant="info" className="text-[10px] font-bold">
                          Selesai Pulang
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] font-bold">
                          Masuk
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          Masuk
                        </span>
                        <span className="font-bold text-slate-800">
                          {record.clockInTimeFormatted}
                        </span>
                        {record.clockInLocation && (
                          <span className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5 font-medium truncate">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span>{record.clockInLocation}</span>
                          </span>
                        )}
                        {record.clockInNotes && (
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={record.clockInNotes}>
                            Catatan: {record.clockInNotes}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          Pulang
                        </span>
                        <span className="font-bold text-slate-800">
                          {record.clockOutTimeFormatted || "—"}
                        </span>
                        {record.clockOutLocation && (
                          <span className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5 font-medium truncate">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span>{record.clockOutLocation}</span>
                          </span>
                        )}
                        {record.clockOutNotes && (
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={record.clockOutNotes}>
                            Catatan: {record.clockOutNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasAuditCorrection && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        {record.clockOutNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
