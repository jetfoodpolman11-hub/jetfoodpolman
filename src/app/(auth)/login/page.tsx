import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/constants";
import { ArrowLeft, CheckCircle2, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: `Masuk Portal Operasional — ${APP_NAME}`,
  description: `Halaman login resmi sistem operasional kurir & admin ${APP_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Top Bar with Back Link */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline-block">
          JetFood Logistics v1.0 • Polman, Sulbar
        </span>
      </div>

      {/* Main Container: Split Hero Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/20 grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side (Desktop Hero Illustration / Brand Story) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-800/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="bg-white px-3 py-1.5 rounded-xl inline-block shadow-md">
              <Image
                src="/images/logo.png"
                alt="JetFood Logo"
                width={150}
                height={55}
                className="h-9 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-4 tracking-tight leading-tight">
              Portal Operasional Lapangan
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Sistem terintegrasi presensi kurir, pelaporan rute harian, dan monitoring logistik Polewali Mandar.
            </p>
          </div>

          {/* Mascot 3D Rider Hero Image */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 drop-shadow-[0_20px_35px_rgba(229,0,0,0.35)]">
              <Image
                src="/images/courier-hero.png"
                alt="Kurir JetFood Polman"
                fill
                sizes="(max-width: 768px) 256px, 320px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Key Feature Highlights */}
          <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>Kode Kurir</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>Login Sidik Jari</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Shield className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>Rute Otomatis</span>
            </div>
          </div>
        </div>

        {/* Right Side (Login Authentication Form) */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">
                Selamat Datang
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan Kode Kurir resmi atau akun Admin untuk melanjutkan.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="py-12 text-center text-sm text-slate-400 animate-pulse">
                  Memuat form autentikasi...
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Butuh bantuan atau lupa kode kurir? Hubungi Admin Operasional JetFood Polman.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
