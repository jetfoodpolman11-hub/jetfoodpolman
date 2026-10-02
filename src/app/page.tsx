import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Truck, ShieldCheck, Clock, MapPin, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge variant="warning" className="uppercase tracking-wider font-semibold">
            Internal Operations System
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {APP_NAME}
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600">
            Sistem manajemen operasional kurir harian terintegrasi untuk wilayah Polewali Mandar dan sekitarnya (WITA).
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Card */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle>Portal Admin</CardTitle>
              <CardDescription>
                Akses penuh untuk pengelolaan data kurir, rekap absensi, approval laporan, dan monitoring analitik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/login?role=admin"
                className="w-full inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Masuk sebagai Admin
              </Link>
            </CardContent>
          </Card>

          {/* Courier Card */}
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <Truck className="h-6 w-6" />
              </div>
              <CardTitle>Portal Kurir</CardTitle>
              <CardDescription>
                Akses lapangan sederhana untuk absensi masuk/pulang, input laporan harian, dan pantau riwayat kerja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/login?role=courier"
                className="w-full inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm"
              >
                Masuk sebagai Kurir
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Highlights */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Fitur Utama Sistem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Timezone WITA</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pencatatan absensi akurat menggunakan zona waktu Asia/Makassar (Sulawesi Barat).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Rute Dinamis</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Integrasi API Wilayah Indonesia dari tingkat Provinsi hingga Kelurahan/Desa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Rekap Real-time</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Monitoring order, omset, ojol, dan jastip langsung dalam genggaman admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {APP_NAME} — {APP_DESCRIPTION}. Internal use only.
        </div>
      </footer>
    </div>
  );
}
