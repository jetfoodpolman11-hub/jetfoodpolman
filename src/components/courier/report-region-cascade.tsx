"use client";

import { useState, useEffect } from "react";
import { getRegencies, getDistricts, getVillages } from "@/actions/regions";
import { Province, Regency, District, Village } from "@/lib/region/types";
import { type RegionSelection } from "@/lib/validations/report";
import { MapPin, Loader2, RotateCcw, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toTitleCase } from "@/lib/region/route";

interface ReportRegionCascadeProps {
  label: string;
  badgeText: string;
  badgeBg: string;
  provinces: Province[];
  initialValue?: RegionSelection | null;
  onChange: (region: RegionSelection | null) => void;
  disabled?: boolean;
}

export function ReportRegionCascade({
  label,
  badgeText,
  badgeBg,
  provinces,
  initialValue,
  onChange,
  disabled = false,
}: ReportRegionCascadeProps) {
  // Cascading lists
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Selected entities
  const [provinceId, setProvinceId] = useState(initialValue?.provinceId || "");
  const [regencyId, setRegencyId] = useState(initialValue?.regencyId || "");
  const [districtId, setDistrictId] = useState(initialValue?.districtId || "");
  const [villageId, setVillageId] = useState(initialValue?.villageId || "");

  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize cascade if initialValue is passed (e.g. edit mode)
  useEffect(() => {
    if (initialValue?.provinceId) {
      getRegencies(initialValue.provinceId)
        .then((data) => {
          setRegencies(data);
          setApiError(null);
        })
        .catch(() => setApiError("Gagal memuat daftar kabupaten/kota"));
    }
    if (initialValue?.regencyId) {
      getDistricts(initialValue.regencyId)
        .then((data) => {
          setDistricts(data);
          setApiError(null);
        })
        .catch(() => setApiError("Gagal memuat daftar kecamatan"));
    }
    if (initialValue?.districtId) {
      getVillages(initialValue.districtId)
        .then((data) => {
          setVillages(data);
          setApiError(null);
        })
        .catch(() => setApiError("Gagal memuat daftar desa/kelurahan"));
    }
  }, [initialValue]);

  // Reset this specific cascade without disturbing the other region or other form fields
  const handleResetCascade = () => {
    setProvinceId("");
    setRegencyId("");
    setDistrictId("");
    setVillageId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setApiError(null);
    onChange(null);
  };

  // Handle Province Change
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setProvinceId(id);
    setRegencyId("");
    setDistrictId("");
    setVillageId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setApiError(null);
    onChange(null);

    if (!id) return;
    setLoadingLevel("regency");
    try {
      const data = await getRegencies(id);
      if (!data || data.length === 0) {
        setApiError("Tidak ada data kabupaten/kota untuk provinsi ini atau terjadi kendala jaringan.");
      } else {
        setRegencies(data);
      }
    } catch {
      setApiError("Terjadi kegagalan saat menghubungi API wilayah (Kabupaten/Kota).");
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Regency Change
  const handleRegencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setRegencyId(id);
    setDistrictId("");
    setVillageId("");
    setDistricts([]);
    setVillages([]);
    setApiError(null);
    onChange(null);

    if (!id) return;
    setLoadingLevel("district");
    try {
      const data = await getDistricts(id);
      if (!data || data.length === 0) {
        setApiError("Tidak ada data kecamatan untuk kabupaten ini atau terjadi kendala jaringan.");
      } else {
        setDistricts(data);
      }
    } catch {
      setApiError("Terjadi kegagalan saat menghubungi API wilayah (Kecamatan).");
    } finally {
      setLoadingLevel(null);
    }
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
      if (!data || data.length === 0) {
        setApiError("Tidak ada data desa/kelurahan untuk kecamatan ini atau terjadi kendala jaringan.");
      } else {
        setVillages(data);
      }
    } catch {
      setApiError("Terjadi kegagalan saat menghubungi API wilayah (Desa/Kelurahan).");
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Village Change
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setVillageId(id);
    setApiError(null);

    if (!id) {
      onChange(null);
      return;
    }

    const prov = provinces.find((p) => p.id === provinceId);
    const reg = regencies.find((r) => r.id === regencyId);
    const dist = districts.find((d) => d.id === districtId);
    const vil = villages.find((v) => v.id === id);

    if (prov && reg && dist && vil) {
      onChange({
        provinceId: prov.id,
        provinceName: prov.name,
        regencyId: reg.id,
        regencyName: reg.name,
        districtId: dist.id,
        districtName: dist.name,
        villageId: vil.id,
        villageName: vil.name,
      });
    } else {
      onChange(null);
    }
  };

  // Selected names for human-readable display confirmation
  const selectedVilObj = villages.find((v) => v.id === villageId);
  const selectedDistObj = districts.find((d) => d.id === districtId);
  const selectedRegObj = regencies.find((r) => r.id === regencyId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-bold text-slate-900">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {provinceId && (
            <button
              type="button"
              onClick={handleResetCascade}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
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

      {/* API Error Alert Banner with Retry Option */}
      {apiError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setApiError(null);
              if (provinceId && !regencyId) {
                setLoadingLevel("regency");
                getRegencies(provinceId)
                  .then(setRegencies)
                  .finally(() => setLoadingLevel(null));
              } else if (regencyId && !districtId) {
                setLoadingLevel("district");
                getDistricts(regencyId)
                  .then(setDistricts)
                  .finally(() => setLoadingLevel(null));
              } else if (districtId && !villageId) {
                setLoadingLevel("village");
                getVillages(districtId)
                  .then(setVillages)
                  .finally(() => setLoadingLevel(null));
              }
            }}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Cascading 4-Tier Dropdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Provinsi */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Provinsi
          </label>
          <select
            value={provinceId}
            onChange={handleProvinceChange}
            disabled={disabled}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Pilih Provinsi...</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Kabupaten/Kota */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
            <span>Kabupaten / Kota</span>
            {loadingLevel === "regency" && (
              <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
            )}
          </label>
          <select
            value={regencyId}
            onChange={handleRegencyChange}
            disabled={disabled || !provinceId || loadingLevel === "regency"}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!provinceId ? "Pilih Provinsi dulu" : "Pilih Kab/Kota..."}
            </option>
            {regencies.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Kecamatan */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
            <span>Kecamatan</span>
            {loadingLevel === "district" && (
              <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
            )}
          </label>
          <select
            value={districtId}
            onChange={handleDistrictChange}
            disabled={disabled || !regencyId || loadingLevel === "district"}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!regencyId ? "Pilih Kab/Kota dulu" : "Pilih Kecamatan..."}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Desa / Kelurahan */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
            <span>Desa / Kelurahan</span>
            {loadingLevel === "village" && (
              <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
            )}
          </label>
          <select
            value={villageId}
            onChange={handleVillageChange}
            disabled={disabled || !districtId || loadingLevel === "village"}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!districtId ? "Pilih Kecamatan dulu" : "Pilih Desa/Kelurahan..."}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Human-Readable Confirmation Breadcrumb */}
      {selectedVilObj && selectedDistObj && selectedRegObj && (
        <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong>Terpilih:</strong> {toTitleCase(selectedVilObj.name)}, Kec.{" "}
            {toTitleCase(selectedDistObj.name)}, {toTitleCase(selectedRegObj.name)}
          </span>
        </div>
      )}
    </div>
  );
}
