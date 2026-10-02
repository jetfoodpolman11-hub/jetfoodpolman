"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clockInAction, clockOutAction, type TodayAttendanceState } from "@/actions/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface AttendanceCardProps {
  initialState: TodayAttendanceState;
  todayDateFormatted: string;
  courierName: string;
}

export function AttendanceCard({
  initialState,
  todayDateFormatted,
  courierName,
}: AttendanceCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isBelumAbsen = initialState.status === "BELUM_ABSEN";
  const isSudahMasuk = initialState.status === "SUDAH_MASUK";
  const isSudahPulang = initialState.status === "SUDAH_PULANG";

  const handleClockIn = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await clockInAction(notes);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Presensi masuk berhasil dicatat.",
        });
        setNotes("");
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal melakukan absen masuk.",
        });
      }
    });
  };

  const handleClockOut = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await clockOutAction(notes);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Presensi pulang berhasil dicatat.",
        });
        setNotes("");
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal melakukan absen pulang.",
        });
      }
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      {/* Header Accent */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Presensi Mandiri Lapangan
            </span>
          </div>
          <span className="text-xs font-semibold text-orange-300">
            Zona WITA (UTC+8)
          </span>
        </div>
        <p className="text-base font-extrabold mt-1 text-white">
          {todayDateFormatted}
        </p>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current State Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Status Presensi Hari Ini
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {initialState.statusLabel}
            </span>
          </div>

          <div>
            {isBelumAbsen && (
              <Badge variant="danger" className="text-xs font-bold px-3 py-1">
                Belum Absen
              </Badge>
            )}
            {isSudahMasuk && (
              <Badge variant="success" className="text-xs font-bold px-3 py-1">
                Aktif Bertugas
              </Badge>
            )}
            {isSudahPulang && (
              <Badge variant="info" className="text-xs font-bold px-3 py-1">
                Presensi Selesai
              </Badge>
            )}
          </div>
        </div>

        {/* Timestamp Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Waktu Masuk
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 block">
              {initialState.clockInTime || "—"}
            </span>
            {initialState.clockInNotes && (
              <span className="text-[11px] text-slate-500 mt-1 block italic truncate" title={initialState.clockInNotes}>
                &quot;{initialState.clockInNotes}&quot;
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Waktu Pulang
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 block">
              {initialState.clockOutTime || "—"}
            </span>
            {initialState.clockOutNotes && (
              <span className="text-[11px] text-slate-500 mt-1 block italic truncate" title={initialState.clockOutNotes}>
                &quot;{initialState.clockOutNotes}&quot;
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {isBelumAbsen && (
          <div className="space-y-3 pt-1">
            <div>
              <label
                htmlFor="clockInNotes"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Catatan Masuk (Opsional)
              </label>
              <textarea
                id="clockInNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kondisi fisik dan sepeda motor prima, siap rute Polewali."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                disabled={isPending}
              />
            </div>

            <button
              type="button"
              onClick={handleClockIn}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-orange-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mencatat Presensi Masuk...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Absen Masuk Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {isSudahMasuk && (
          <div className="space-y-3 pt-1">
            <div>
              <label
                htmlFor="clockOutNotes"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Catatan Pulang (Opsional)
              </label>
              <textarea
                id="clockOutNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Seluruh rute pengantaran selesai dengan aman."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                disabled={isPending}
              />
            </div>

            <button
              type="button"
              onClick={handleClockOut}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mencatat Presensi Pulang...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Absen Pulang Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {isSudahPulang && (
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-center space-y-1.5">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">
              Presensi Hari Ini Lengkap
            </h3>
            <p className="text-xs text-emerald-700">
              Terima kasih atas kerja keras Anda di lapangan hari ini, {courierName}!
            </p>
          </div>
        )}

        {/* Security / System Notice */}
        <div className="flex items-start gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Waktu dan tanggal dicatat otomatis oleh server (WITA). Kurir tidak dapat memilih atau mengubah waktu secara manual.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
