"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type AnalyticsPeriod } from "@/actions/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, RotateCcw } from "lucide-react";

interface AnalyticsPeriodFilterProps {
  currentPeriod: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
}

export function AnalyticsPeriodFilter({
  currentPeriod,
  startDate,
  endDate,
  periodLabel,
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

  const periodTabs: { id: AnalyticsPeriod; label: string }[] = [
    { id: "today", label: "Hari Ini" },
    { id: "week", label: "Minggu" },
    { id: "month", label: "Bulan" },
    { id: "custom", label: "Custom Date Range" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Filter Periode Rekapitulasi
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          Aktif: <strong className="text-slate-900">{periodLabel}</strong>
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
