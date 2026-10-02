"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

interface AdminLoginScreenProps {
  redirectTo?: string;
}

export function AdminLoginScreen({ redirectTo }: AdminLoginScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@jetfoodpolman.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdminSubmit = (targetEmail?: string, targetPass?: string) => {
    setError(null);
    const formData = new FormData();
    formData.append("identifier", (targetEmail || email).trim());
    formData.append("password", targetPass || password);
    formData.append("redirectTo", redirectTo || "/admin/dashboard");

    startTransition(async () => {
      try {
        const res = await loginAction(null, formData);
        if (!res.success) {
          setError(res.error || "Email atau kata sandi administrator salah.");
        } else if (res.redirectTo) {
          router.push(res.redirectTo);
          router.refresh();
        }
      } catch (err) {
        console.error("Admin login error:", err);
        setError("Terjadi kendala sistem saat memverifikasi akun administrator.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      {/* Back Link to Courier Portal */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Halaman Kurir</span>
        </Link>
        <span className="text-[11px] font-mono text-red-500 uppercase tracking-widest font-bold">
          Admin Area
        </span>
      </div>

      {/* Main Admin Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/30 p-8 sm:p-10 space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-block p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
            <Image
              src="/images/logo.png"
              alt="JetFood Logo"
              width={140}
              height={45}
              className="h-9 w-auto object-contain mx-auto"
              priority
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Portal Administrator</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Masuk Administrator
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Pusat kendali operasional, manajemen kurir, dan monitoring data JetFood Polman.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdminSubmit();
          }}
          className="space-y-4"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Administrator
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jetfoodpolman.com"
                required
                disabled={isPending}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
              />
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
              />
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
          >
            {isPending ? (
              <span>Memverifikasi Admin...</span>
            ) : (
              <>
                <span>Masuk Portal Admin</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Akses Cepat Pengujian:
          </span>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@jetfoodpolman.com");
              setPassword("admin123");
              handleAdminSubmit("admin@jetfoodpolman.com", "admin123");
            }}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            ⚡ Masuk Cepat Super Admin
          </button>
        </div>
      </div>
    </div>
  );
}
