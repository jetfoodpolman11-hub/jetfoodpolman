"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Province } from "@/lib/region/types";
import { PackageTypeItem } from "@/actions/package-types";
import {
  createDailyReportAction,
  updateDailyReportAction,
  type DailyReportRecord,
} from "@/actions/daily-reports";
import { type RegionSelection } from "@/lib/validations/report";
import {
  formatRouteDisplay,
  validateRouteSelection,
  toTitleCase,
} from "@/lib/region/route";
import { ReportRegionCascade } from "./report-region-cascade";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import {
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Package,
  Layers,
  Banknote,
  Bike,
  ShoppingBag,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface DailyReportFormProps {
  provinces: Province[];
  packageTypes: PackageTypeItem[];
  todayWita: string;
  initialData?: DailyReportRecord | null;
  isEditing?: boolean;
}

export function DailyReportForm({
  provinces,
  packageTypes,
  todayWita,
  initialData,
  isEditing = false,
}: DailyReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form States
  const [date, setDate] = useState(initialData?.date || todayWita);
  const [packageTypeId, setPackageTypeId] = useState(
    initialData?.packageTypeId || (packageTypes[0]?.id ?? "")
  );

  const [origin, setOrigin] = useState<RegionSelection | null>(
    initialData?.origin || null
  );
  const [destination, setDestination] = useState<RegionSelection | null>(
    initialData?.destination || null
  );

  const [orderCount, setOrderCount] = useState<number>(
    initialData?.orderCount !== undefined ? initialData.orderCount : 0
  );
  const [omset, setOmset] = useState<number>(
    initialData?.omset !== undefined ? initialData.omset : 0
  );

  const [ojolCount, setOjolCount] = useState<number>(
    initialData?.ojolCount !== undefined ? initialData.ojolCount : 0
  );
  const [ojolAmount, setOjolAmount] = useState<number>(
    initialData?.ojolAmount !== undefined ? initialData.ojolAmount : 0
  );

  const [jastipCount, setJastipCount] = useState<number>(
    initialData?.jastipCount !== undefined ? initialData.jastipCount : 0
  );
  const [jastipAmount, setJastipAmount] = useState<number>(
    initialData?.jastipAmount !== undefined ? initialData.jastipAmount : 0
  );

  const [notes, setNotes] = useState(initialData?.notes || "");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Business rule check: route evaluation via validateRouteSelection
  const routeValidation =
    origin && destination ? validateRouteSelection(origin, destination) : null;
  const isIdenticalRoute = routeValidation?.isIdentical ?? false;
  const isSameDistrict = routeValidation?.isSameDistrict ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!origin) {
      setFeedback({
        type: "error",
        message: "Wilayah keberangkatan wajib dipilih lengkap hingga desa/kelurahan.",
      });
      return;
    }

    if (!destination) {
      setFeedback({
        type: "error",
        message: "Wilayah tujuan wajib dipilih lengkap hingga desa/kelurahan.",
      });
      return;
    }

    const routeCheck = validateRouteSelection(origin, destination);
    if (!routeCheck.isValid) {
      setFeedback({
        type: "error",
        message: routeCheck.error || "Rute perjalanan tidak valid.",
      });
      return;
    }

    if (!packageTypeId) {
      setFeedback({
        type: "error",
        message: "Jenis paket wajib dipilih.",
      });
      return;
    }

    if (orderCount < 0 || Number.isNaN(orderCount)) {
      setFeedback({
        type: "error",
        message: "Jumlah order harus berupa angka valid dan tidak boleh negatif.",
      });
      return;
    }

    if (omset < 0 || Number.isNaN(omset)) {
      setFeedback({
        type: "error",
        message: "Omset harus berupa nilai uang valid dan tidak boleh negatif.",
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        courierId: initialData?.courierId || "",
        date,
        packageTypeId,
        origin,
        destination,
        orderCount: Number(orderCount),
        omset: Number(omset),
        ojolCount: Number(ojolCount) || 0,
        ojolAmount: Number(ojolAmount) || 0,
        jastipCount: Number(jastipCount) || 0,
        jastipAmount: Number(jastipAmount) || 0,
        notes: notes.trim() || undefined,
      };

      const res = isEditing && initialData
        ? await updateDailyReportAction(initialData.id, payload)
        : await createDailyReportAction(payload);

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan laporan operasional.",
        });
      } else {
        setFeedback({
          type: "success",
          message: res.message || "Laporan operasional berhasil disimpan.",
        });
        setTimeout(() => {
          router.push("/courier/history");
        }, 1200);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span>{feedback.message}</span>
            {feedback.type === "success" && (
              <span className="block text-[11px] text-emerald-700 font-normal mt-0.5">
                Mengarahkan ke halaman riwayat laporan...
              </span>
            )}
          </div>
        </div>
      )}


      {/* 1. Date & Package Type Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Operasional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Tanggal Operasional (WITA)</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isPending || isEditing}
                className="text-xs"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tersinkronisasi otomatis dengan zona waktu Makassar (WITA).
              </span>
            </div>

            {/* Jenis Paket (Active Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-slate-500" />
                <span>Jenis Paket</span>
              </label>
              <select
                value={packageTypeId}
                onChange={(e) => setPackageTypeId(e.target.value)}
                disabled={isPending}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              >
                {packageTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.description ? `— ${p.description}` : ""}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Hanya menampilkan jenis paket aktif yang disetujui Admin.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Rute Perjalanan: Departure & Destination Regions */}
      <div className="space-y-3">
        <ReportRegionCascade
          label="1. Wilayah Keberangkatan (Departure)"
          badgeText="Asal"
          badgeBg="bg-blue-100 text-blue-700"
          provinces={provinces}
          initialValue={origin}
          onChange={setOrigin}
          disabled={isPending}
        />

        <ReportRegionCascade
          label="2. Wilayah Tujuan (Destination)"
          badgeText="Tujuan"
          badgeBg="bg-emerald-100 text-emerald-700"
          provinces={provinces}
          initialValue={destination}
          onChange={setDestination}
          disabled={isPending}
        />
      </div>

      {/* Live Route Display & Validation Box */}
      {origin?.villageId && destination?.villageId && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            isIdenticalRoute
              ? "bg-rose-50 border-rose-200 text-rose-950"
              : isSameDistrict
              ? "bg-blue-50/80 border-blue-200 text-blue-950"
              : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
              Hasil Display Rute Perjalanan
            </span>
            {isIdenticalRoute ? (
              <Badge variant="danger" className="text-[10px] font-bold">
                Rute Tidak Sah (Identik)
              </Badge>
            ) : isSameDistrict ? (
              <Badge variant="info" className="text-[10px] font-bold">
                Rute Dalam Kecamatan Sama (Sah &amp; Valid)
              </Badge>
            ) : (
              <Badge variant="success" className="text-[10px] font-bold">
                Rute Antar Wilayah (Sah &amp; Valid)
              </Badge>
            )}
          </div>

          <p className="text-sm font-extrabold text-slate-900 leading-snug">
            {formatRouteDisplay(origin, destination)}
          </p>

          {isIdenticalRoute ? (
            <p className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Desa/Kelurahan keberangkatan ({origin.villageName}) dan tujuan ({destination.villageName}) tidak boleh sama. Rute harus berbeda.
              </span>
            </p>
          ) : isSameDistrict ? (
            <p className="text-[11px] text-blue-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>
                Pengantaran antar-desa dalam satu kecamatan ({toTitleCase(origin.districtName)}) sah dan valid untuk dilaporkan.
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Rute perjalanan antar-wilayah terkonfirmasi lengkap dan valid.
              </span>
            </p>
          )}
        </div>
      )}

      {/* 3. Operational Metrics: Orders, Omset, Ojol, Jastip */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-bold text-slate-900">
              Metrik Operasional &amp; Pendapatan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jumlah Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Jumlah Order Paket</span>
                <span className="text-[10px] text-slate-400 font-normal">paket</span>
              </label>
              <Input
                type="number"
                min={0}
                value={orderCount}
                onChange={(e) => setOrderCount(parseInt(e.target.value) || 0)}
                disabled={isPending}
                className="text-xs font-bold"
                placeholder="0"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total paket yang diantarkan pada rute ini.
              </span>
            </div>

            {/* Omset (Rupiah) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Omset Pengiriman</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {formatRupiah(omset)}
                </span>
              </label>
              <Input
                type="number"
                min={0}
                step={500}
                value={omset}
                onChange={(e) => setOmset(parseFloat(e.target.value) || 0)}
                disabled={isPending}
                className="text-xs font-bold"
                placeholder="0"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total nilai ongkir / penerimaan operasional (Rupiah).
              </span>
            </div>
          </div>

          {/* Ojol & Jastip Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Ojol */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bike className="h-3.5 w-3.5 text-orange-600" />
                <span>Layanan Ojol (Transportasi)</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Jumlah Trip
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={ojolCount}
                    onChange={(e) => setOjolCount(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Nominal (Rp)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={ojolAmount}
                    onChange={(e) => setOjolAmount(parseFloat(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Jastip */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
                <span>Layanan Jastip (Titip Beli)</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Jumlah Titipan
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={jastipCount}
                    onChange={(e) => setJastipCount(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Nominal (Rp)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={jastipAmount}
                    onChange={(e) => setJastipAmount(parseFloat(e.target.value) || 0)}
                    disabled={isPending}
                    className="text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Catatan Operasional (Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kondisi cuaca hujan di Matakali, titipan pesanan khusus diterima utuh."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Controls */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.back()}
          disabled={isPending}
          className="flex-1 sm:flex-none text-xs"
        >
          Batal
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isPending}
          disabled={isPending || isIdenticalRoute || !origin || !destination}
          className="flex-1 gap-2 text-xs font-bold"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan Laporan</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Kirim Laporan Operasional</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
