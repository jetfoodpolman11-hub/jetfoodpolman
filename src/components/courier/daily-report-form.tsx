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
  FileText,
} from "lucide-react";

/**
 * Custom 3D Red Isometric/Depth Vector Icons for Courier Service Features
 * Designed with multi-layered 3D depth, specular highlights, and zero AI-template clichés.
 */
function Icon3DJastip() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(80,0,0,0.45)]">
      {/* 3D Extruded Back Bag Handle */}
      <path
        d="M13 13V10.5C13 7.73858 15.2386 5.5 18 5.5C20.7614 5.5 23 7.73858 23 10.5V13"
        stroke="#FFD1D1"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* 3D Side Depth Shadow of Shopping Bag */}
      <path
        d="M8.5 13.5H27.5L29 29.5C29.1 30.6 28.2 31.5 27.1 31.5H10.9C9.8 31.5 8.9 30.6 9 29.5L8.5 13.5Z"
        fill="#8F0000"
      />
      {/* 3D Main Front Bag Body */}
      <path
        d="M7.5 12.5H26.5L28 28.2C28.1 29.3 27.2 30.2 26.1 30.2H9.9C8.8 30.2 7.9 29.3 8 28.2L7.5 12.5Z"
        fill="url(#jastipBagGrad)"
      />
      {/* Top Rim Highlight */}
      <path d="M7.8 12.8H26.2" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      {/* 3D Front Pocket / Verification Badge */}
      <rect x="11.5" y="17" width="11" height="8.5" rx="2.2" fill="#DC0000" opacity="0.22" />
      <path
        d="M14.2 21.2L16.3 23.3L20.3 19.2"
        stroke="#DC0000"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="jastipBagGrad" x1="17" y1="12.5" x2="17" y2="30.2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFE0E0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Icon3DPaket() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(80,0,0,0.45)]">
      {/* Isometric Top Face */}
      <path
        d="M18 5.5L30 11.8L18 18.1L6 11.8L18 5.5Z"
        fill="#FFFFFF"
      />
      {/* Isometric Left Face */}
      <path
        d="M6 11.8L18 18.1V30.8L6 24.5V11.8Z"
        fill="#FFD6D6"
      />
      {/* Isometric Right Face (3D Shaded) */}
      <path
        d="M30 11.8L18 18.1V30.8L30 24.5V11.8Z"
        fill="#FCA5A5"
      />
      {/* 3D Parcel Packing Tape Across Top & Front */}
      <path
        d="M12 8.65L24 14.95V20.2L21 21.8V16.5L9 10.2L12 8.65Z"
        fill="#DC0000"
      />
      {/* Crisp 3D Ridge Highlight */}
      <path
        d="M6.5 11.8L18 17.9L29.5 11.8"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Icon3DLangsung() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(80,0,0,0.45)]">
      {/* 3D Extruded Back Bubble Depth */}
      <path
        d="M9 10.5C9 8.567 10.567 7 12.5 7H25.5C27.433 7 29 8.567 29 10.5V20.5C29 22.433 27.433 24 25.5 24H15L9.8 28.2C9.4 28.5 9 28.2 9 27.7V10.5Z"
        fill="#8F0000"
      />
      {/* 3D Front Direct Order Chat Card */}
      <path
        d="M7.5 9.5C7.5 7.567 9.067 6 11 6H24C25.933 6 27.5 7.567 27.5 9.5V19.5C27.5 21.433 25.933 23 24 23H13.5L8.3 27.2C7.9 27.5 7.5 27.2 7.5 26.7V9.5Z"
        fill="url(#langsungGrad)"
      />
      {/* Direct Forward Transfer Arrow Inside */}
      <path
        d="M12.5 14.5H21.5M21.5 14.5L18.2 11.2M21.5 14.5L18.2 17.8"
        stroke="#DC0000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3D Mini Direct Badge */}
      <circle cx="25.5" cy="24.5" r="5" fill="#FFFFFF" stroke="#B30000" strokeWidth="1.4" />
      <path d="M23.8 24.5L25 25.7L27.5 23.2" stroke="#DC0000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="langsungGrad" x1="17.5" y1="6" x2="17.5" y2="27.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFE0E0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Icon3DOjol() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(80,0,0,0.45)]">
      {/* 3D Handlebar & Mirror Arms */}
      <path
        d="M9 11.5H27"
        stroke="#FFD6D6"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="9.5" r="2" fill="#FFFFFF" />
      <circle cx="28" cy="9.5" r="2" fill="#FFFFFF" />
      {/* 3D Scooter Front Body Shield */}
      <path
        d="M12.5 13.5C12.5 11.8 13.8 10.5 15.5 10.5H20.5C22.2 10.5 23.5 11.8 23.5 13.5L25 23.5C25.2 25 24 26.2 22.5 26.2H13.5C12 26.2 10.8 25 11 23.5L12.5 13.5Z"
        fill="url(#ojolBodyGrad)"
      />
      {/* 3D Headlamp */}
      <circle cx="18" cy="12" r="3.2" fill="#DC0000" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* 3D Front Fender & Tire */}
      <rect x="15.2" y="23.5" width="5.6" height="7.5" rx="2.8" fill="#7A0000" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M14.5 20.5C16.5 19.2 19.5 19.2 21.5 20.5" stroke="#DC0000" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="ojolBodyGrad" x1="18" y1="10.5" x2="18" y2="26.2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFD8D8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Icon3DRandom() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(80,0,0,0.45)]">
      {/* 4 3D Tactile Modular Service Blocks */}
      {/* Top-Left Block */}
      <rect x="7.5" y="8.5" width="9" height="9" rx="2.5" fill="#8F0000" />
      <rect x="7" y="7" width="9" height="9" rx="2.5" fill="#FFFFFF" />
      {/* Top-Right Block (Tilted 3D Accent) */}
      <rect x="20" y="8.5" width="9" height="9" rx="2.5" fill="#8F0000" />
      <rect x="19.5" y="7" width="9" height="9" rx="2.5" fill="#FFD6D6" />
      <circle cx="24" cy="11.5" r="2" fill="#DC0000" />
      {/* Bottom-Left Block */}
      <rect x="7.5" y="20.5" width="9" height="9" rx="2.5" fill="#8F0000" />
      <rect x="7" y="19" width="9" height="9" rx="2.5" fill="#FFD6D6" />
      <path d="M9.8 23.5H13.2" stroke="#DC0000" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom-Right Block */}
      <rect x="20" y="20.5" width="9" height="9" rx="2.5" fill="#8F0000" />
      <rect x="19.5" y="19" width="9" height="9" rx="2.5" fill="#FFFFFF" />
      <path d="M22.2 23.5L23.5 24.8L26 22.2" stroke="#DC0000" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ServiceFeatureMeta {
  key: "jastip" | "paket" | "langsung" | "ojol" | "random";
  title: string;
  subtitle: string;
  fullDescription: string;
  order: number;
  Icon3D: React.ComponentType;
  qtyLabel: string;
  qtyUnit: string;
  qtyHelper: string;
  nominalLabel: string;
  nominalHelper: string;
}

function getServiceVisualMeta(
  name: string,
  description: string | null
): ServiceFeatureMeta {
  const lower = name.toLowerCase().trim();
  if (lower.includes("jastip")) {
    return {
      key: "jastip",
      title: "Jastip",
      subtitle: "Jasa Titip",
      fullDescription:
        "Layanan Jasa Titip (belanja, cek barang, cek tempat, pemenuhan kebutuhan costumer)",
      order: 1,
      Icon3D: Icon3DJastip,
      qtyLabel: "Jumlah Titipan",
      qtyUnit: "titipan",
      qtyHelper:
        "Total order titipan (belanja, cek barang, cek tempat, atau kebutuhan costumer) pada rute ini.",
      nominalLabel: "Nominal Harga Titipan",
      nominalHelper:
        "Total nominal biaya / harga jasa titipan yang diterima pada rute ini (Rupiah).",
    };
  }
  if (lower.includes("paket")) {
    return {
      key: "paket",
      title: "Paket",
      subtitle: "Antar Jemput",
      fullDescription: "Layanan Antar Jemput Paket (mitra - costumer)",
      order: 2,
      Icon3D: Icon3DPaket,
      qtyLabel: "Jumlah Order Paket",
      qtyUnit: "paket",
      qtyHelper:
        "Total paket (mitra - costumer) yang dijemput atau diantarkan pada rute ini.",
      nominalLabel: "Omset Pengiriman",
      nominalHelper:
        "Total nilai ongkir / penerimaan pengiriman paket pada rute ini (Rupiah).",
    };
  }
  if (lower.includes("langsung")) {
    return {
      key: "langsung",
      title: "Langsung",
      subtitle: "Tanpa Admin",
      fullDescription:
        "Paket atau Jastip yang di peroleh oleh kurir tanpa melalui admin (chat langsung costumer/mitra ke kurir)",
      order: 3,
      Icon3D: Icon3DLangsung,
      qtyLabel: "Jumlah Order Langsung",
      qtyUnit: "order",
      qtyHelper:
        "Total paket atau jastip yang diperoleh langsung oleh kurir tanpa melalui admin.",
      nominalLabel: "Nominal Order Langsung",
      nominalHelper:
        "Total nominal penerimaan dari order langsung kurir pada rute ini (Rupiah).",
    };
  }
  if (lower.includes("ojol")) {
    return {
      key: "ojol",
      title: "Ojol",
      subtitle: "Ojek Online",
      fullDescription: "Layanan Ojek Online",
      order: 4,
      Icon3D: Icon3DOjol,
      qtyLabel: "Jumlah Trip",
      qtyUnit: "trip",
      qtyHelper: "Total trip layanan ojek online pada rute ini.",
      nominalLabel: "Nominal",
      nominalHelper:
        "Total nominal tarif / penerimaan ojek online pada rute ini (Rupiah).",
    };
  }
  if (lower.includes("random")) {
    return {
      key: "random",
      title: "Random",
      subtitle: "Jasa Apa Saja",
      fullDescription: "Layanan Jasa Apa Saja",
      order: 5,
      Icon3D: Icon3DRandom,
      qtyLabel: "Jumlah Layanan",
      qtyUnit: "layanan",
      qtyHelper: "Total pengerjaan layanan jasa apa saja pada rute ini.",
      nominalLabel: "Nominal Layanan",
      nominalHelper:
        "Total nominal penerimaan dari layanan jasa tersebut pada rute ini (Rupiah).",
    };
  }
  return {
    key: "paket",
    title: toTitleCase(name),
    subtitle: description ? description.slice(0, 14) : "Layanan",
    fullDescription: description || "Layanan Operasional Kurir JetFood Polman",
    order: 99,
    Icon3D: Icon3DPaket,
    qtyLabel: "Jumlah Order",
    qtyUnit: "order",
    qtyHelper: "Total order layanan yang diselesaikan pada rute ini.",
    nominalLabel: "Nominal / Omset",
    nominalHelper: "Total penerimaan operasional pada rute ini (Rupiah).",
  };
}

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

  const sortedPackageTypes = [...packageTypes].sort(
    (a, b) =>
      getServiceVisualMeta(a.name, a.description).order -
      getServiceVisualMeta(b.name, b.description).order
  );

  // Form States
  const [date, setDate] = useState(initialData?.date || todayWita);
  const [packageTypeId, setPackageTypeId] = useState(
    initialData?.packageTypeId || (sortedPackageTypes[0]?.id ?? "")
  );

  const [origin, setOrigin] = useState<RegionSelection | null>(
    initialData?.origin || null
  );
  const [destination, setDestination] = useState<RegionSelection | null>(
    initialData?.destination || null
  );

  const initialEffectiveQty = initialData
    ? (initialData.orderCount || 0) +
      (initialData.ojolCount || 0) +
      (initialData.jastipCount || 0)
    : 0;
  const initialEffectiveNominal = initialData
    ? (initialData.omset || 0) +
      (initialData.ojolAmount || 0) +
      (initialData.jastipAmount || 0)
    : 0;

  const [orderCount, setOrderCount] = useState<number>(initialEffectiveQty);
  const [omset, setOmset] = useState<number>(initialEffectiveNominal);

  const [notes, setNotes] = useState(initialData?.notes || "");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedPkg =
    sortedPackageTypes.find((p) => p.id === packageTypeId) ||
    sortedPackageTypes[0];
  const activeMeta = selectedPkg
    ? getServiceVisualMeta(selectedPkg.name, selectedPkg.description)
    : getServiceVisualMeta("Paket", null);

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
        message: "Fitur layanan wajib dipilih.",
      });
      return;
    }

    if (orderCount < 0 || Number.isNaN(orderCount)) {
      setFeedback({
        type: "error",
        message: `${activeMeta.qtyLabel} harus berupa angka valid dan tidak boleh negatif.`,
      });
      return;
    }

    if (omset < 0 || Number.isNaN(omset)) {
      setFeedback({
        type: "error",
        message: `${activeMeta.nominalLabel} harus berupa nilai uang valid dan tidak boleh negatif.`,
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
        orderCount: Number(orderCount) || 0,
        omset: Number(omset) || 0,
        ojolCount: 0,
        ojolAmount: 0,
        jastipCount: 0,
        jastipAmount: 0,
        notes: notes.trim() || undefined,
      };

      const res =
        isEditing && initialData
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

      {/* 1. Fitur Laporan / Layanan (3D Red Icons Grid) & Tanggal Operasional */}
      <Card className="border-slate-200 shadow-2xs rounded-2xl">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-[#DC0000]" />
                <span>Pilih Fitur / Jenis Layanan Laporan</span>
              </label>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC0000] bg-red-50 px-2 py-0.5 rounded-full">
                Wajib Dipilih
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {sortedPackageTypes.map((p) => {
                const meta = getServiceVisualMeta(p.name, p.description);
                const Icon3DComponent = meta.Icon3D;
                const isSelected = packageTypeId === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => setPackageTypeId(p.id)}
                    className={`group relative flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-[#DC0000] bg-red-50/75 ring-2 ring-[#DC0000]/20 shadow-[0_8px_18px_rgba(220,0,0,0.16)] -translate-y-0.5"
                        : "border-slate-200/90 bg-white hover:border-red-300 hover:bg-red-50/20 shadow-2xs active:scale-[0.98]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 text-[#DC0000]">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-[#DC0000] text-white" />
                      </span>
                    )}

                    {/* 3D Red Tactile Icon Container */}
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform bg-gradient-to-b from-[#FF2E2E] via-[#DC0000] to-[#990000] border border-[#B00000] shadow-[0_6px_12px_rgba(185,0,0,0.32),0_2px_4px_rgba(0,0,0,0.18),inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2.5px_4px_rgba(85,0,0,0.55)] ${
                        isSelected
                          ? "scale-105 ring-2 ring-red-200"
                          : "group-hover:scale-105"
                      }`}
                    >
                      <Icon3DComponent />
                    </div>

                    <span
                      className={`mt-2.5 text-xs font-extrabold tracking-tight block leading-tight ${
                        isSelected ? "text-[#DC0000]" : "text-slate-900"
                      }`}
                    >
                      {meta.title}
                    </span>
                    <span
                      className={`text-[10px] font-medium block mt-0.5 truncate max-w-full ${
                        isSelected ? "text-red-700/90 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {meta.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Feature Official Description Box */}
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50/50 border border-red-200/70 px-3.5 py-2.5 text-xs text-slate-700">
              <span className="inline-flex h-5 px-2 items-center justify-center rounded-md bg-[#DC0000] text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0 mt-0.5 shadow-2xs">
                {activeMeta.title}
              </span>
              <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-relaxed">
                {activeMeta.fullDescription}
              </p>
            </div>
          </div>

          {/* Kolom Input Tanggal Operasional (WITA) */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#DC0000]" />
              <span>Tanggal Operasional (WITA)</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending || isEditing}
              className="text-xs font-semibold"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Tersinkronisasi otomatis dengan zona waktu Makassar (WITA).
            </span>
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
            isIdenticalRoute || isSameDistrict
              ? "bg-blue-50/80 border-blue-200 text-blue-950"
              : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
              Hasil Display Rute Perjalanan
            </span>
            {isIdenticalRoute ? (
              <Badge variant="info" className="text-[10px] font-bold">
                Rute Dalam Kelurahan/Desa Sama (Sah &amp; Valid)
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
            <p className="text-[11px] text-blue-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>
                Pengantaran di dalam kelurahan/desa yang sama ({toTitleCase(origin.villageName)}, {toTitleCase(origin.districtName)}) sah dan valid untuk dilaporkan.
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

      {/* 3. Dynamic Operational Metrics Based on Selected Feature */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#DC0000]" />
              <span className="text-xs font-bold text-slate-900">
                Metrik Operasional &amp; Pendapatan
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DC0000] bg-red-50 border border-red-200/70 px-2.5 py-0.5 rounded-full">
              Layanan {activeMeta.title}
            </span>
          </div>

          {/* Only 2 Dynamic Fields Corresponding to the Selected Feature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dynamic Quantity Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{activeMeta.qtyLabel}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {activeMeta.qtyUnit}
                </span>
              </label>
              <Input
                type="number"
                min={0}
                value={orderCount}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setOrderCount(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                disabled={isPending}
                className="text-xs font-bold"
                placeholder="0"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                {activeMeta.qtyHelper}
              </span>
            </div>

            {/* Dynamic Nominal (Rupiah) Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{activeMeta.nominalLabel}</span>
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
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setOmset(Math.max(0, parseFloat(e.target.value) || 0))
                }
                disabled={isPending}
                className="text-xs font-bold"
                placeholder="0"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                {activeMeta.nominalHelper}
              </span>
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
              placeholder="Contoh: Kondisi cuaca hujan di Matakali, pesanan diterima utuh oleh costumer."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
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
          disabled={isPending || !origin || !destination}
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
