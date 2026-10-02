"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminCorrectAttendanceAction,
  type AttendanceRecord,
} from "@/actions/attendance";
import { AlertCircle, CheckCircle2, ShieldAlert, Save } from "lucide-react";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSuccess?: () => void;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: AttendanceCorrectionModalProps) {
  if (!isOpen || !record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Koreksi Manual Presensi Kurir"
      description={`Koreksi catatan presensi ${record.courierName} (${record.courierCode}) pada tanggal ${record.date}.`}
    >
      <CorrectionForm
        key={record.id}
        record={record}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

function CorrectionForm({
  record,
  onClose,
  onSuccess,
}: {
  record: AttendanceRecord;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Helper to extract HH:mm from ISO
  const extractTimeHHMM = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const hours = String(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Makassar",
          hour: "numeric",
          hour12: false,
        }).format(d)
      ).padStart(2, "0");
      const minutes = String(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Makassar",
          minute: "numeric",
        }).format(d)
      ).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const [inTime, setInTime] = useState(extractTimeHHMM(record.clockInTime));
  const [outTime, setOutTime] = useState(extractTimeHHMM(record.clockOutTime));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Construct ISO timestamp from record.date (YYYY-MM-DD) and HH:mm in WITA (UTC+8)
  const constructWitaIso = (timeStr: string): string | undefined => {
    if (!timeStr) return undefined;
    const [hh, mm] = timeStr.split(":");
    if (!hh || !mm) return undefined;
    // WITA is UTC+8, so ISO string can be YYYY-MM-DDTHH:mm:00+08:00
    return `${record.date}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00+08:00`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!reason.trim()) {
      setError("Alasan koreksi presensi wajib dicatat untuk audit trail.");
      return;
    }

    const clockInIso = inTime ? constructWitaIso(inTime) : undefined;
    const clockOutIso = outTime ? constructWitaIso(outTime) : undefined;

    startTransition(async () => {
      const res = await adminCorrectAttendanceAction(record.id, {
        clockInTime: clockInIso,
        clockOutTime: clockOutIso,
        reason: reason.trim(),
      });

      if (!res.success) {
        setError(res.error || "Gagal menyimpan koreksi presensi.");
      } else {
        setSuccessMsg(res.message || "Koreksi presensi berhasil disimpan.");
        router.refresh();
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Audit Warning Notice */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-xs flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Peringatan Audit Trail Sistem:</span>
          <span>
            Setiap perubahan data presensi akan disimpan permanen beserta identitas akun admin yang melakukan koreksi dan waktu pencatatan WITA.
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Courier Info Summary */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Nama Kurir
          </span>
          <span className="font-bold text-slate-800">{record.courierName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Kode Kurir
          </span>
          <span className="font-bold text-slate-800">{record.courierCode}</span>
        </div>
      </div>

      {/* Time Adjustments */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jam Masuk (WITA)
          </label>
          <Input
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jam Pulang (WITA)
          </label>
          <Input
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Mandatory Reason */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Alasan Koreksi <span className="text-rose-500">* (Wajib)</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Kurir lupa checkout karena gangguan jaringan di lapangan, terkonfirmasi selesai tugas pukul 17:15 WITA."
          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          disabled={isPending}
          required
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isPending}
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Simpan Koreksi</span>
        </Button>
      </div>
    </form>
  );
}
