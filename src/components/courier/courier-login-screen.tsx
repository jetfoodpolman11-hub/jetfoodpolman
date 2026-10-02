"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginCourierByIdAction, loginWithBiometricAction } from "@/actions/auth";
import { authenticateDeviceBiometric, getStoredBiometricStatus } from "@/lib/auth/biometric";
import { Fingerprint, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface CourierLoginScreenProps {
  redirectTo?: string;
}

export function CourierLoginScreen({ redirectTo }: CourierLoginScreenProps) {
  const router = useRouter();
  const [courierId, setCourierId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [bioLoading, setBioLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmitCode = (targetCode?: string) => {
    const code = (targetCode || courierId).trim().toUpperCase();
    if (!code) {
      setError("Silakan masukkan ID atau Kode Kurir Anda.");
      return;
    }

    setError(null);
    setInfo(null);

    startTransition(async () => {
      try {
        const res = await loginCourierByIdAction(code, redirectTo);
        if (!res.success) {
          setError(res.error || "ID / Kode Kurir tidak valid.");
        } else if (res.redirectTo) {
          router.push(res.redirectTo);
          router.refresh();
        }
      } catch (err) {
        console.error("Courier login error:", err);
        setError("Terjadi kendala jaringan saat memverifikasi ID Kurir.");
      }
    });
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setInfo(null);

    const storedStatus = getStoredBiometricStatus();
    if (!storedStatus.isEnabled) {
      setInfo(
        "Sensor sidik jari belum diaktifkan di HP ini. Masukkan ID Kurir terlebih dahulu, lalu aktifkan di menu Dashboard."
      );
      return;
    }

    setBioLoading(true);
    try {
      const bioAuth = await authenticateDeviceBiometric();
      if (!bioAuth.success || !bioAuth.courierCode) {
        setError(bioAuth.error || "Verifikasi sidik jari dibatalkan atau tidak dikenali.");
        setBioLoading(false);
        return;
      }

      startTransition(async () => {
        const res = await loginWithBiometricAction(bioAuth.courierCode!);
        if (!res.success) {
          setError(res.error || "Gagal masuk menggunakan sidik jari.");
        } else if (res.redirectTo) {
          router.push(res.redirectTo);
          router.refresh();
        }
      });
    } catch (err) {
      console.error("Biometric login error:", err);
      setError("Sensor sidik jari perangkat tidak dapat diakses.");
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 font-sans select-none">
      {/* Mobile Frame Container matching blueprint design */}
      <div className="w-full max-w-[444px] min-h-screen sm:min-h-0 bg-[#ECECEC] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-slate-800/20 sm:my-6">
        {/* Top Half (Red Hero Area with white Logo and 3D Courier Rider) */}
        <div className="relative w-full bg-[#DC0000] flex flex-col items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[444/508] max-h-[480px]">
            <Image
              src="/images/courier-login-hero.png"
              alt="Kurir JetFood Polman"
              fill
              priority
              sizes="(max-width: 444px) 100vw, 444px"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Bottom Half (Light Grey Content & Form Area) */}
        <div className="flex-1 bg-[#ECECEC] px-6 sm:px-7 pt-6 pb-8 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title */}
            <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 text-center tracking-tight leading-tight">
              Laporan Harian Kurir<br />JetFood Polman
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-slate-600 text-center max-w-xs mx-auto leading-relaxed pt-1">
              Input data atau laporan harian kurir JetFood Polewali Mandar. Absen rrute, barang/paket, dll.
            </p>
          </div>

          {/* Form Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitCode();
            }}
            className="mt-6 space-y-3"
          >
            {/* Input Field: White Rounded Pill */}
            <div>
              <input
                type="text"
                value={courierId}
                onChange={(e) => setCourierId(e.target.value)}
                placeholder="Masukkan ID / Kode Kurir"
                disabled={isPending || bioLoading}
                className="w-full h-14 bg-white rounded-2xl px-5 text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-xs border-0 focus:outline-none focus:ring-2 focus:ring-[#DC0000] uppercase tracking-wider transition-all"
                autoComplete="off"
              />
            </div>

            {/* Error & Info Feedback */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {info && (
              <div className="p-3 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span className="leading-tight">{info}</span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="pt-1 flex items-center gap-3">
              {/* Tombol Merah Panjang (Masuk ID) */}
              <button
                type="submit"
                disabled={isPending || bioLoading}
                className="flex-1 h-14 bg-[#DC0000] hover:bg-[#B80000] active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isPending ? (
                  <span className="text-xs sm:text-sm font-bold tracking-wide animate-pulse">
                    Memverifikasi...
                  </span>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Tombol Merah Kotak (Fingerprint / Sidik Jari) */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isPending || bioLoading}
                className="w-14 h-14 bg-[#DC0000] hover:bg-[#B80000] active:scale-[0.98] text-white rounded-2xl shadow-md flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-70"
                title="Login Cepat dengan Sidik Jari"
              >
                {bioLoading ? (
                  <Fingerprint className="h-7 w-7 text-white animate-pulse" />
                ) : (
                  <Fingerprint className="h-7 w-7 text-white" />
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Bar for Easy Testing */}
          <div className="mt-5 pt-3 border-t border-slate-300/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
              Akses Cepat Pengujian:
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCourierId("JF-001");
                  handleSubmitCode("JF-001");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold shadow-2xs border border-slate-200 transition-colors cursor-pointer"
              >
                ⚡ Kurir Ali (JF-001)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCourierId("JF-002");
                  handleSubmitCode("JF-002");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold shadow-2xs border border-slate-200 transition-colors cursor-pointer"
              >
                ⚡ Kurir Budi (JF-002)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
