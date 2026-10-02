"use client";

import { useState } from "react";
import { type AttendanceRecord } from "@/actions/attendance";
import { AttendanceCorrectionModal } from "./attendance-correction-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Clock, AlertCircle } from "lucide-react";
import { formatWitaDateFull } from "@/lib/date";

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Kurir</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Pulang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan & Log Audit</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700">
                      Tidak ada data presensi ditemukan
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan sesuaikan tanggal atau filter kurir di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((item) => {
                  const isPulang = item.status === "PULANG";
                  const hasAuditCorrection =
                    item.clockOutNotes &&
                    item.clockOutNotes.includes("[Koreksi Admin");

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Courier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.courierName
                              ? item.courierName.slice(0, 2).toUpperCase()
                              : "KR"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.courierName || "Kurir"}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                              {item.courierCode || "JF-KURIR"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatWitaDateFull(item.date)}
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="h-3 w-3 text-emerald-600" />
                          {item.clockInTimeFormatted}
                        </span>
                      </td>

                      {/* Clock Out */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.clockOutTimeFormatted ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <Clock className="h-3 w-3 text-blue-600" />
                            {item.clockOutTimeFormatted}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">
                            Belum checkout
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPulang ? (
                          <Badge variant="info" className="font-bold text-[10px]">
                            Selesai Pulang
                          </Badge>
                        ) : (
                          <Badge variant="success" className="font-bold text-[10px]">
                            Sudah Masuk
                          </Badge>
                        )}
                      </td>

                      {/* Notes / Audit */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {item.clockInNotes && (
                            <p className="text-[11px] text-slate-600 truncate" title={`Masuk: ${item.clockInNotes}`}>
                              <strong className="text-slate-500">Masuk:</strong> {item.clockInNotes}
                            </p>
                          )}
                          {item.clockOutNotes && !hasAuditCorrection && (
                            <p className="text-[11px] text-slate-600 truncate" title={`Pulang: ${item.clockOutNotes}`}>
                              <strong className="text-slate-500">Pulang:</strong> {item.clockOutNotes}
                            </p>
                          )}
                          {hasAuditCorrection && (
                            <div className="text-[10px] text-amber-800 bg-amber-50/90 p-1.5 rounded border border-amber-200/60 font-mono">
                              {item.clockOutNotes}
                            </div>
                          )}
                          {!item.clockInNotes && !item.clockOutNotes && (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRecord(item)}
                          className="gap-1 text-slate-600 hover:text-slate-900 text-xs"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Koreksi</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={() => setEditingRecord(null)}
      />
    </>
  );
}
