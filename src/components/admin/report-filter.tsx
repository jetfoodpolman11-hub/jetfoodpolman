"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, RotateCcw, Calendar, User, Package, MapPin, Search } from "lucide-react";

interface CourierOption {
  id: string;
  fullName: string;
  courierCode: string;
}

interface PackageTypeOption {
  id: string;
  name: string;
}

interface ReportFilterProps {
  couriers: CourierOption[];
  packageTypes: PackageTypeOption[];
  currentDate?: string;
  currentCourierId?: string;
  currentPackageTypeId?: string;
  currentRouteQuery?: string;
}

export function ReportFilter({
  couriers,
  packageTypes,
  currentDate = "",
  currentCourierId = "ALL",
  currentPackageTypeId = "ALL",
  currentRouteQuery = "",
}: ReportFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState(currentDate);
  const [courierId, setCourierId] = useState(currentCourierId);
  const [packageTypeId, setPackageTypeId] = useState(currentPackageTypeId);
  const [routeQuery, setRouteQuery] = useState(currentRouteQuery);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (date && date.trim()) params.set("date", date.trim());
    if (courierId && courierId !== "ALL") params.set("courierId", courierId);
    if (packageTypeId && packageTypeId !== "ALL") params.set("packageTypeId", packageTypeId);
    if (routeQuery && routeQuery.trim()) params.set("routeQuery", routeQuery.trim());

    const currentPerPage = searchParams.get("perPage");
    if (currentPerPage) {
      params.set("perPage", currentPerPage);
    }

    // Reset to page 1 on new filter
    params.set("page", "1");

    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleReset = () => {
    setDate("");
    setCourierId("ALL");
    setPackageTypeId("ALL");
    setRouteQuery("");
    router.push("/admin/reports");
  };

  const hasActiveFilters = Boolean(
    date ||
    (courierId && courierId !== "ALL") ||
    (packageTypeId && packageTypeId !== "ALL") ||
    (routeQuery && routeQuery.trim())
  );

  return (
    <form
      onSubmit={handleApply}
      className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Filter Monitoring Laporan
          </span>
        </div>
        {hasActiveFilters && (
          <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
            Filter Aktif
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Date Filter */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Tanggal</span>
            </span>
            {date && (
              <button
                type="button"
                onClick={() => setDate("")}
                className="text-[10px] text-slate-400 hover:text-slate-700"
              >
                Hapus
              </button>
            )}
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        {/* 2. Courier Dropdown */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Kurir</span>
          </label>
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="ALL">Semua Kurir</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.courierCode})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Package Type Dropdown */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Jenis Paket</span>
          </label>
          <select
            value={packageTypeId}
            onChange={(e) => setPackageTypeId(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="ALL">Semua Jenis Paket</option>
            {packageTypes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Route Search Input */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>Cari Rute / Wilayah</span>
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Contoh: Manding, Polewali..."
              value={routeQuery}
              onChange={(e) => setRouteQuery(e.target.value)}
              className="text-xs h-9 pr-8"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filter</span>
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Terapkan Filter</span>
        </Button>
      </div>
    </form>
  );
}
