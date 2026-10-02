import { requireAdmin } from "@/lib/auth/guards";
import { getDailyReportById } from "@/actions/daily-reports";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { formatWitaDateFull } from "@/lib/date";
import {
  ArrowLeft,
  FileText,
  User,
  MapPin,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail Laporan Operasional — JetFood Polman",
};

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const report = await getDailyReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link href="/admin/reports">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Monitoring Laporan</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="text-xs font-semibold px-3 py-1 bg-white">
            ID: {report.id}
          </Badge>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" className="text-[11px] font-bold">
              Terverifikasi
            </Badge>
            <span className="text-xs text-slate-400">
              Disimpan pada {report.createdAtFormatted}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Laporan Operasional Harian
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dibuat oleh kurir lapangan untuk tanggal operasional {formatWitaDateFull(report.date)}.
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
            Total Omset Laporan
          </span>
          <span className="text-3xl font-black text-emerald-700 block">
            {formatRupiah(report.omset)}
          </span>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kurir Profile & Tanggal */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-orange-600" />
              <span>Informasi Kurir &amp; Jadwal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Nama Kurir</span>
              <span className="font-bold text-slate-900">{report.courierName || "Kurir Lapangan"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Kode Kurir</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {report.courierCode || "JF-KURIR"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Tanggal Operasional</span>
              <span className="font-bold text-slate-900">{formatWitaDateFull(report.date)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Zona Waktu</span>
              <span className="font-semibold text-slate-700">WITA (Asia/Makassar, UTC+8)</span>
            </div>
          </CardContent>
        </Card>

        {/* Paket & Metrik Pengantaran */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <span>Metrik Paket &amp; Pendapatan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Jenis Paket</span>
              <Badge variant="info" className="font-bold text-[11px]">
                {report.packageTypeName}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Jumlah Order Paket</span>
              <span className="font-extrabold text-slate-900 text-sm">{report.orderCount} paket</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Layanan Ojek Online (Ojol)</span>
              <span className="font-semibold text-slate-800">
                {report.ojolCount > 0
                  ? `${report.ojolCount}x (${formatRupiah(report.ojolAmount)})`
                  : "0 (Rp 0)"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Layanan Jasa Titip (Jastip)</span>
              <span className="font-semibold text-slate-800">
                {report.jastipCount > 0
                  ? `${report.jastipCount}x (${formatRupiah(report.jastipAmount)})`
                  : "0 (Rp 0)"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rute Perjalanan Breakdown */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span>Rute Operasional Lengkap</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {report.routeDisplay}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Titik Keberangkatan (Departure)</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Desa / Kelurahan:</span>
                  <span className="font-bold text-slate-900">{report.origin.villageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kecamatan:</span>
                  <span className="font-bold text-slate-900">{report.origin.districtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kabupaten / Kota:</span>
                  <span className="font-bold text-slate-900">{report.origin.regencyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provinsi:</span>
                  <span className="font-bold text-slate-900">{report.origin.provinceName}</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex justify-between text-[11px] text-slate-400">
                  <span>ID Kode Wilayah:</span>
                  <span className="font-mono">{report.origin.villageId}</span>
                </div>
              </div>
            </div>

            {/* Destination Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Titik Tujuan (Destination)</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Desa / Kelurahan:</span>
                  <span className="font-bold text-slate-900">{report.destination.villageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kecamatan:</span>
                  <span className="font-bold text-slate-900">{report.destination.districtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kabupaten / Kota:</span>
                  <span className="font-bold text-slate-900">{report.destination.regencyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provinsi:</span>
                  <span className="font-bold text-slate-900">{report.destination.provinceName}</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex justify-between text-[11px] text-slate-400">
                  <span>ID Kode Wilayah:</span>
                  <span className="font-mono">{report.destination.villageId}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catatan Lapangan */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            <span>Catatan Operasional Kurir</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {report.notes ? (
            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
              {report.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Tidak ada catatan tambahan yang dilaporkan oleh kurir.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
