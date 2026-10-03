"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type AnalyticsPeriod,
  type OperationalAnalyticsSummary,
  type CourierRecapItem,
  type RouteRecapItem,
} from "@/actions/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import {
  Calendar,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";

interface AnalyticsPeriodFilterProps {
  currentPeriod: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
  summary?: OperationalAnalyticsSummary;
  courierRecap?: CourierRecapItem[];
  routeRecap?: RouteRecapItem[];
}

export function AnalyticsPeriodFilter({
  currentPeriod,
  startDate,
  endDate,
  periodLabel,
  summary,
  courierRecap = [],
  routeRecap = [],
}: AnalyticsPeriodFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(currentPeriod);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handleSelectPreset = (preset: AnalyticsPeriod) => {
    setSelectedPeriod(preset);
    if (preset !== "custom") {
      startTransition(() => {
        router.push(`/admin/analytics?period=${preset}`);
      });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("period", "custom");
      if (customStart) params.set("startDate", customStart);
      if (customEnd) params.set("endDate", customEnd);
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSelectedPeriod("today");
    startTransition(() => {
      router.push("/admin/analytics?period=today");
    });
  };

  const buildRekapExportConfig = () => {
    const s = summary || {
      totalOrders: 0,
      totalOmset: 0,
      totalOjolCount: 0,
      totalOjolAmount: 0,
      totalJastipCount: 0,
      totalJastipAmount: 0,
      presentCouriersCount: 0,
      totalAttendanceDays: 0,
      totalReports: 0,
    };

    return {
      fileName: `Rekap_Operasional_JetFood_${startDate}_sd_${endDate}`,
      title: "Rekapitulasi Operasional & Analitik Kurir",
      subtitle: `Periode Rekapitulasi: ${periodLabel} (WITA)`,
      summaryItems: [
        { label: "Total Order Paket", value: `${formatNumber(s.totalOrders)} Paket` },
        { label: "Total Omset Paket", value: formatRupiah(s.totalOmset) },
        {
          label: "Total Ojol",
          value: `${formatNumber(s.totalOjolCount)} Trip (${formatRupiah(s.totalOjolAmount)})`,
        },
        {
          label: "Total Jastip",
          value: `${formatNumber(s.totalJastipCount)} Order (${formatRupiah(s.totalJastipAmount)})`,
        },
        {
          label: "Kehadiran Kurir",
          value: `${formatNumber(s.presentCouriersCount)} Kurir (${s.totalAttendanceDays} Hari Kerja)`,
        },
        { label: "Total Laporan", value: `${formatNumber(s.totalReports)} Laporan` },
      ],
      tables: [
        {
          sectionTitle: "1. Rekapitulasi Operasional per Kurir",
          headers: [
            "No",
            "Kode Kurir",
            "Nama Kurir",
            "Status",
            "Hari Hadir",
            "Jumlah Laporan",
            "Total Order Paket",
            "Total Omset Paket",
            "Ojol (Trip & Nilai)",
            "Jastip (Order & Nilai)",
          ],
          rows: courierRecap.map((c, idx) => [
            idx + 1,
            c.courierCode,
            c.courierName,
            c.status === "ACTIVE" ? "Aktif" : "Nonaktif",
            `${formatNumber(c.attendanceDays)} hari`,
            `${formatNumber(c.reportCount)} laporan`,
            `${formatNumber(c.totalOrders)} paket`,
            formatRupiah(c.totalOmset),
            `${formatNumber(c.ojolCount)} trip (${formatRupiah(c.ojolAmount)})`,
            `${formatNumber(c.jastipCount)} order (${formatRupiah(c.jastipAmount)})`,
          ]),
          footerRow:
            courierRecap.length > 0
              ? [
                  "",
                  "TOTAL AKUMULASI",
                  "",
                  "",
                  `${formatNumber(s.totalAttendanceDays)} hari kerja`,
                  `${formatNumber(s.totalReports)} laporan`,
                  `${formatNumber(s.totalOrders)} paket`,
                  formatRupiah(s.totalOmset),
                  `${formatNumber(s.totalOjolCount)} trip (${formatRupiah(s.totalOjolAmount)})`,
                  `${formatNumber(s.totalJastipCount)} order (${formatRupiah(s.totalJastipAmount)})`,
                ]
              : undefined,
        },
        {
          sectionTitle: "2. Rekapitulasi Operasional per Rute Perjalanan",
          headers: [
            "No",
            "Wilayah Keberangkatan (Asal)",
            "Wilayah Tujuan",
            "Jumlah Order Paket",
            "Total Omset Rute",
            "Jumlah Laporan",
          ],
          rows: routeRecap.map((r, idx) => [
            idx + 1,
            r.originDisplay,
            r.destDisplay,
            `${formatNumber(r.totalOrders)} paket`,
            formatRupiah(r.totalOmset),
            `${formatNumber(r.reportCount)} laporan`,
          ]),
          footerRow:
            routeRecap.length > 0
              ? [
                  "",
                  `TOTAL (${routeRecap.length} RUTE AKTIF)`,
                  "",
                  `${formatNumber(s.totalOrders)} paket`,
                  formatRupiah(s.totalOmset),
                  `${formatNumber(s.totalReports)} laporan`,
                ]
              : undefined,
        },
      ],
    };
  };

  const periodTabs: { id: AnalyticsPeriod; label: string }[] = [
    { id: "today", label: "Hari Ini" },
    { id: "week", label: "Minggu" },
    { id: "month", label: "Bulan" },
    { id: "custom", label: "Custom Date Range" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Filter Periode Rekapitulasi
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Aktif: <strong className="text-slate-900">{periodLabel}</strong>
          </span>
        </div>

        {/* Export PDF & Excel Buttons for Rekap */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportToExcel(buildRekapExportConfig())}
            className="gap-1.5 border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 text-xs font-bold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Download Rekap Excel (.xls)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportToPdf(buildRekapExportConfig())}
            className="gap-1.5 border-red-300 bg-red-50/80 text-red-800 hover:bg-red-100 text-xs font-bold"
          >
            <FileDown className="h-3.5 w-3.5 text-red-700" />
            <span>Download Rekap PDF</span>
          </Button>
        </div>
      </div>

      {/* Period Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {periodTabs.map((tab) => {
          const isActive = selectedPeriod === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={isPending}
              onClick={() => handleSelectPreset(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {currentPeriod !== "today" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset ke Hari Ini</span>
          </button>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {selectedPeriod === "custom" && (
        <form
          onSubmit={handleApplyCustom}
          className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tanggal Mulai (WITA)
            </label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tanggal Akhir (WITA)
            </label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>
          <div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{isPending ? "Memuat..." : "Terapkan Rentang Tanggal"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
