"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, RotateCcw, Calendar, User } from "lucide-react";

interface CourierOption {
  id: string;
  fullName: string;
  courierCode: string;
}

interface AttendanceFilterProps {
  couriers: CourierOption[];
  currentDate: string;
  currentCourierId: string;
}

export function AttendanceFilter({
  couriers,
  currentDate,
  currentCourierId,
}: AttendanceFilterProps) {
  const router = useRouter();

  const [date, setDate] = useState(currentDate);
  const [courierId, setCourierId] = useState(currentCourierId || "ALL");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (courierId && courierId !== "ALL") params.set("courierId", courierId);

    router.push(`/admin/attendance?${params.toString()}`);
  };

  const handleReset = () => {
    setDate(currentDate);
    setCourierId("ALL");
    router.push(`/admin/attendance?date=${currentDate}`);
  };

  return (
    <form
      onSubmit={handleApply}
      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-end gap-3"
    >
      {/* Date Filter */}
      <div className="flex-1 space-y-1">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Filter Tanggal (WITA)</span>
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Courier Dropdown Filter */}
      <div className="flex-1 space-y-1">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span>Filter Kurir</span>
        </label>
        <select
          value={courierId}
          onChange={(e) => setCourierId(e.target.value)}
          className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="ALL">Semua Kurir</option>
          {couriers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.courierCode})
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 md:pt-0">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="flex-1 md:flex-none gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Terapkan</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5"
          title="Reset filter ke hari ini"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      </div>
    </form>
  );
}
