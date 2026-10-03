"use client";

import { useState, useEffect } from "react";
import { getDistricts, getVillages } from "@/actions/regions";
import { Province, District, Village } from "@/lib/region/types";
import { type RegionSelection } from "@/lib/validations/report";
import { MapPin, Loader2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toTitleCase } from "@/lib/region/route";

// Fixed to Polewali Mandar, Sulawesi Barat as requested
const POLMAN_PROVINCE = { id: "76", name: "SULAWESI BARAT" };
const POLMAN_REGENCY = { id: "7602", name: "KABUPATEN POLEWALI MANDAR" };

// Restricted to 4 operational districts: Polewali, Binuang, Anreapi, Matakali
const ALLOWED_DISTRICTS: District[] = [
  { id: "7602050", regency_id: "7602", name: "POLEWALI" },
  { id: "7602051", regency_id: "7602", name: "BINUANG" },
  { id: "7602052", regency_id: "7602", name: "ANREAPI" },
  { id: "7602043", regency_id: "7602", name: "MATAKALI" },
];
const ALLOWED_DISTRICT_ORDER = ["7602050", "7602051", "7602052", "7602043"];

interface ReportRegionCascadeProps {
  label: string;
  badgeText: string;
  badgeBg: string;
  provinces?: Province[];
  initialValue?: RegionSelection | null;
  onChange: (region: RegionSelection | null) => void;
  disabled?: boolean;
}

export function ReportRegionCascade({
  label,
  badgeText,
  badgeBg,
  initialValue,
  onChange,
  disabled = false,
}: ReportRegionCascadeProps) {
  // Cascading lists within Polewali Mandar (4 operational districts)
  const [districts, setDistricts] = useState<District[]>(ALLOWED_DISTRICTS);
  const [villages, setVillages] = useState<Village[]>([]);

  // Selected entities
  const [districtId, setDistrictId] = useState(initialValue?.districtId || "");
  const [villageId, setVillageId] = useState(initialValue?.villageId || "");

  const [loadingLevel, setLoadingLevel] = useState<"district" | "village" | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync Polewali Mandar districts on mount and filter to the 4 allowed districts
  useEffect(() => {
    let isMounted = true;
    getDistricts(POLMAN_REGENCY.id)
      .then((data) => {
        if (!isMounted) return;
        const filtered = ALLOWED_DISTRICT_ORDER
          .map((id) => data.find((d) => d.id === id))
          .filter((d): d is District => Boolean(d));
        setDistricts(filtered.length === 4 ? filtered : ALLOWED_DISTRICTS);
        setApiError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDistricts(ALLOWED_DISTRICTS);
      })
      .finally(() => {
        if (isMounted) setLoadingLevel(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize villages if initialValue has districtId (e.g. edit mode)
  useEffect(() => {
    if (!initialValue?.districtId) return;
    let isMounted = true;
    getVillages(initialValue.districtId)
      .then((data) => {
        if (!isMounted) return;
        setVillages(data);
        setApiError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setApiError("Gagal memuat daftar desa/kelurahan");
      });

    return () => {
      isMounted = false;
    };
  }, [initialValue?.districtId]);

  // Reset this specific cascade
  const handleResetCascade = () => {
    setDistrictId("");
    setVillageId("");
    setVillages([]);
    setApiError(null);
    onChange(null);
  };

  // Handle District Change
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setDistrictId(id);
    setVillageId("");
    setVillages([]);
    setApiError(null);
    onChange(null);

    if (!id) return;

    setLoadingLevel("village");
    try {
      const data = await getVillages(id);
      setVillages(data);
    } catch (err) {
      console.error(`Failed to load villages for district ${id}:`, err);
      setApiError("Koneksi API wilayah terganggu saat memuat kelurahan/desa.");
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Village Change
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setVillageId(id);

    if (!id) {
      onChange(null);
      return;
    }

    const selectedDistrict = districts.find((d) => d.id === districtId);
    const selectedVillage = villages.find((v) => v.id === id);

    if (selectedDistrict && selectedVillage) {
      const selection: RegionSelection = {
        provinceId: POLMAN_PROVINCE.id,
        provinceName: POLMAN_PROVINCE.name,
        regencyId: POLMAN_REGENCY.id,
        regencyName: POLMAN_REGENCY.name,
        districtId: selectedDistrict.id,
        districtName: selectedDistrict.name,
        villageId: selectedVillage.id,
        villageName: selectedVillage.name,
      };
      onChange(selection);
    }
  };

  const selectedDistObj = districts.find((d) => d.id === districtId);
  const selectedVillObj = villages.find((v) => v.id === villageId);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold text-slate-900">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {districtId && (
            <button
              type="button"
              onClick={handleResetCascade}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Reset pilihan wilayah ini"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeBg}`}
          >
            {badgeText}
          </span>
        </div>
      </div>

      {/* Scope Info: Polewali Mandar, Sulbar */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-500">
        <span>Wilayah: <strong>Kab. Polewali Mandar</strong></span>
        <span className="text-[10px] text-slate-400 font-mono">Sulbar (WITA)</span>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span className="flex-1">{apiError}</span>
        </div>
      )}

      {/* 2 Focused Dropdowns: Kecamatan & Desa/Kelurahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Kecamatan */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Kecamatan</span>
            {loadingLevel === "district" && (
              <Loader2 className="h-3 w-3 animate-spin text-red-600" />
            )}
          </label>
          <select
            value={districtId}
            onChange={handleDistrictChange}
            disabled={disabled || loadingLevel === "district"}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
            required
          >
            <option value="">
              {loadingLevel === "district" ? "Memuat Kecamatan..." : "Pilih Kecamatan di Polman..."}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {toTitleCase(d.name)}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Desa / Kelurahan */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Desa / Kelurahan</span>
            {loadingLevel === "village" && (
              <Loader2 className="h-3 w-3 animate-spin text-red-600" />
            )}
          </label>
          <select
            value={villageId}
            onChange={handleVillageChange}
            disabled={disabled || !districtId || loadingLevel === "village"}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
            required
          >
            <option value="">
              {!districtId
                ? "Pilih Kecamatan dulu"
                : loadingLevel === "village"
                ? "Memuat Desa/Kelurahan..."
                : "Pilih Desa / Kelurahan..."}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {toTitleCase(v.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Human-Readable Confirmation Breadcrumb */}
      {selectedDistObj && selectedVillObj && (
        <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-700 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-900">
            {toTitleCase(selectedVillObj.name)}, {toTitleCase(selectedDistObj.name)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({selectedVillObj.id})
          </span>
        </div>
      )}
    </div>
  );
}
