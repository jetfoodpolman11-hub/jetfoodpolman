"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
  testRegionConnectionAction,
} from "@/actions/regions";
import { Province, Regency, District, Village, RegionConnectionResult } from "@/lib/region/types";
import { Globe, RefreshCw, CheckCircle2, AlertTriangle, MapPin, Layers } from "lucide-react";

interface RegionIntegrationTesterProps {
  providerInfo: {
    type: string;
    name: string;
    baseUrl: string;
  };
}

export function RegionIntegrationTester({ providerInfo }: RegionIntegrationTesterProps) {
  // Test connection state
  const [connResult, setConnResult] = useState<RegionConnectionResult | null>(null);
  const [isTesting, startTesting] = useTransition();

  // Cascade dropdown states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  // Initial load of provinces
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      setLoadingStep("Memuat daftar provinsi...");
      try {
        const provs = await getProvinces();
        if (isMounted) setProvinces(provs);
      } catch (err) {
        console.error("Failed to load provinces:", err);
      } finally {
        if (isMounted) setLoadingStep(null);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestConnection = () => {
    startTesting(async () => {
      const res = await testRegionConnectionAction();
      setConnResult(res);
    });
  };

  const handleProvinceChange = async (provId: string) => {
    const prov = provinces.find((p) => p.id === provId) || null;
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    if (provId) {
      setLoadingStep("Memuat kabupaten/kota...");
      const data = await getRegencies(provId);
      setRegencies(data);
      setLoadingStep(null);
    }
  };

  const handleRegencyChange = async (regId: string) => {
    const reg = regencies.find((r) => r.id === regId) || null;
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setDistricts([]);
    setVillages([]);

    if (regId) {
      setLoadingStep("Memuat kecamatan...");
      const data = await getDistricts(regId);
      setDistricts(data);
      setLoadingStep(null);
    }
  };

  const handleDistrictChange = async (distId: string) => {
    const dist = districts.find((d) => d.id === distId) || null;
    setSelectedDistrict(dist);
    setSelectedVillage(null);
    setVillages([]);

    if (distId) {
      setLoadingStep("Memuat desa/kelurahan...");
      const data = await getVillages(distId);
      setVillages(data);
      setLoadingStep(null);
    }
  };

  const handleVillageChange = (vilId: string) => {
    const vil = villages.find((v) => v.id === vilId) || null;
    setSelectedVillage(vil);
  };

  return (
    <div className="space-y-6">
      {/* Provider Info Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{providerInfo.name}</CardTitle>
                <CardDescription className="text-xs font-mono">
                  {providerInfo.baseUrl}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isTesting}
              className="flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Uji Koneksi API</span>
            </Button>
          </div>
        </CardHeader>

        {connResult && (
          <CardContent className="pt-2">
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                connResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {connResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-semibold flex items-center gap-2">
                  <span>{connResult.message}</span>
                  <Badge variant={connResult.success ? "success" : "warning"}>
                    {connResult.latencyMs} ms
                  </Badge>
                </div>
                {connResult.error && (
                  <p className="text-[11px] opacity-80">{connResult.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Interactive Region Cascade Tester */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Layers className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">
              Simulasi Integrasi Wilayah Bertingkat (Cascade Selector)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Uji kelancaran data bertingkat: Provinsi &rarr; Kabupaten &rarr; Kecamatan &rarr; Desa/Kelurahan.
            Data ini akan digunakan oleh kurir saat menginput laporan rute harian.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingStep && (
            <div className="text-xs text-orange-600 font-medium flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{loadingStep}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Provinsi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Provinsi
              </label>
              <select
                value={selectedProvince?.id || ""}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Kabupaten */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Kabupaten / Kota
              </label>
              <select
                value={selectedRegency?.id || ""}
                onChange={(e) => handleRegencyChange(e.target.value)}
                disabled={!selectedProvince || regencies.length === 0}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">-- Pilih Kab/Kota --</option>
                {regencies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Kecamatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Kecamatan
              </label>
              <select
                value={selectedDistrict?.id || ""}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedRegency || districts.length === 0}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">-- Pilih Kecamatan --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Desa/Kelurahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Desa / Kelurahan
              </label>
              <select
                value={selectedVillage?.id || ""}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedDistrict || villages.length === 0}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">-- Pilih Desa/Kelurahan --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Hierarchy Path Display */}
          {selectedProvince && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Hasil Resolusi Hierarki Wilayah:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-800">
                  {selectedProvince.name}
                </span>
                {selectedRegency && (
                  <>
                    <span className="text-slate-400">&rsaquo;</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRegency.name}
                    </span>
                  </>
                )}
                {selectedDistrict && (
                  <>
                    <span className="text-slate-400">&rsaquo;</span>
                    <span className="font-semibold text-slate-800">
                      {selectedDistrict.name}
                    </span>
                  </>
                )}
                {selectedVillage && (
                  <>
                    <span className="text-slate-400">&rsaquo;</span>
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedVillage.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
