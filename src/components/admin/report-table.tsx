"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteDailyReportAction,
  type DailyReportRecord,
} from "@/actions/daily-reports";
import { Pagination } from "./pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { formatWitaDateFull } from "@/lib/date";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import {
  Eye,
  AlertCircle,
  MapPin,
  Bike,
  ShoppingBag,
  FileSpreadsheet,
  FileDown,
  Trash2,
  Loader2,
} from "lucide-react";

interface ReportTableProps {
  reports: DailyReportRecord[];
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}

export function ReportTable({
  reports,
  page,
  totalPages,
  total,
  perPage,
}: ReportTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteReport = (item: DailyReportRecord) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus permanen laporan kurir "${item.courierName || "Kurir"}" (${item.routeDisplay}) pada tanggal ${formatWitaDateFull(item.date)}?`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    startTransition(async () => {
      const res = await deleteDailyReportAction(item.id);
      setDeletingId(null);
      if (!res.success) {
        window.alert(res.error || "Gagal menghapus laporan operasional.");
      } else {
        router.refresh();
      }
    });
  };
  const buildExportConfig = () => {
    const pageOrders = reports.reduce((s, r) => s + r.orderCount, 0);
    const pageOmset = reports.reduce((s, r) => s + r.omset, 0);
    const pageOjolCount = reports.reduce((s, r) => s + r.ojolCount, 0);
    const pageOjolAmt = reports.reduce((s, r) => s + r.ojolAmount, 0);
    const pageJastipCount = reports.reduce((s, r) => s + r.jastipCount, 0);
    const pageJastipAmt = reports.reduce((s, r) => s + r.jastipAmount, 0);

    return {
      fileName: `Laporan_Operasional_JetFood_Halaman_${page}`,
      title: "Laporan Harian Operasional Kurir",
      subtitle: `Halaman ${page} dari ${totalPages} — Total Data Terfilter: ${total} Laporan`,
      summaryItems: [
        { label: "Total Laporan", value: `${reports.length} Laporan` },
        { label: "Volume Order Paket", value: `${pageOrders} Paket` },
        { label: "Akumulasi Omset Paket", value: formatRupiah(pageOmset) },
        {
          label: "Total Ojol & Jastip",
          value: `${pageOjolCount + pageJastipCount}x (${formatRupiah(pageOjolAmt + pageJastipAmt)})`,
        },
      ],
      tables: [
        {
          sectionTitle: "Daftar Rincian Laporan Harian Kurir",
          headers: [
            "No",
            "Tanggal",
            "Kode Kurir",
            "Nama Kurir",
            "Rute (Wilayah Asal -> Tujuan)",
            "Jenis Paket",
            "Order Paket",
            "Omset Paket",
            "Ojol (Trip & Nilai)",
            "Jastip (Order & Nilai)",
            "Catatan",
          ],
          rows: reports.map((item, idx) => [
            (page - 1) * perPage + idx + 1,
            formatWitaDateFull(item.date),
            item.courierCode || "JF-KURIR",
            item.courierName || "Kurir",
            item.routeDisplay,
            item.packageTypeName,
            `${item.orderCount} paket`,
            formatRupiah(item.omset),
            item.ojolCount > 0
              ? `${item.ojolCount}x (${formatRupiah(item.ojolAmount)})`
              : "-",
            item.jastipCount > 0
              ? `${item.jastipCount}x (${formatRupiah(item.jastipAmount)})`
              : "-",
            item.notes || "-",
          ]),
          footerRow:
            reports.length > 0
              ? [
                  "",
                  "TOTAL HALAMAN INI",
                  "",
                  "",
                  "",
                  "",
                  `${pageOrders} paket`,
                  formatRupiah(pageOmset),
                  `${pageOjolCount}x (${formatRupiah(pageOjolAmt)})`,
                  `${pageJastipCount}x (${formatRupiah(pageJastipAmt)})`,
                  "",
                ]
              : undefined,
        },
      ],
    };
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Export Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div className="text-xs font-bold text-slate-700">
          Daftar Laporan Operasional ({total} laporan)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportToExcel(buildExportConfig())}
            className="gap-1.5 border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 text-xs font-bold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Download Excel (.xls)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportToPdf(buildExportConfig())}
            className="gap-1.5 border-red-300 bg-red-50/80 text-red-800 hover:bg-red-100 text-xs font-bold"
          >
            <FileDown className="h-3.5 w-3.5 text-red-700" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Kurir</th>
              <th className="py-3 px-4">Rute Perjalanan (Asal → Tujuan)</th>
              <th className="py-3 px-4">Paket</th>
              <th className="py-3 px-4 text-center">Order</th>
              <th className="py-3 px-4 text-right">Omset</th>
              <th className="py-3 px-4">Ojol &amp; Jastip</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-800">
                      Tidak ada laporan ditemukan
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tidak ada data laporan operasional yang cocok dengan kriteria filter saat ini.
                    </p>
                    <div className="pt-2">
                      <Link href="/admin/reports">
                        <Button variant="outline" size="sm" className="text-xs">
                          Hapus Filter
                        </Button>
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((item) => {
                const hasOjol = item.ojolCount > 0;
                const hasJastip = item.jastipCount > 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 1. Date */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {formatWitaDateFull(item.date)}
                    </td>

                    {/* 2. Courier */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {item.courierName
                            ? item.courierName.slice(0, 2).toUpperCase()
                            : "KR"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.courierName || "Kurir"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {item.courierCode || "JF-KURIR"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Route Display: Origin -> Destination */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-900 leading-tight">
                          {item.routeDisplay}
                        </span>
                      </div>
                    </td>

                    {/* 4. Package Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="neutral" className="text-[10px] font-bold">
                        {item.packageTypeName}
                      </Badge>
                    </td>

                    {/* 5. Order Count */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 whitespace-nowrap">
                      {item.orderCount}
                    </td>

                    {/* 6. Omset */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(item.omset)}
                    </td>

                    {/* 7. Ojol & Jastip */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {hasOjol && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 mr-1">
                            <Bike className="h-3 w-3" />
                            <span>
                              {item.ojolCount}x ({formatRupiah(item.ojolAmount)})
                            </span>
                          </div>
                        )}
                        {hasJastip && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                            <ShoppingBag className="h-3 w-3" />
                            <span>
                              {item.jastipCount}x ({formatRupiah(item.jastipAmount)})
                            </span>
                          </div>
                        )}
                        {!hasOjol && !hasJastip && (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* 8. Action: View Detail & Delete */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link href={`/admin/reports/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-slate-700 hover:text-slate-900 text-xs font-semibold h-8"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending && deletingId === item.id}
                          onClick={() => handleDeleteReport(item)}
                          className="gap-1 border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:text-rose-800 text-xs font-semibold h-8 cursor-pointer"
                          title="Hapus laporan ini"
                        >
                          {isPending && deletingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Server-Side Pagination Bar */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={total}
        perPage={perPage}
      />
    </div>
  );
}
