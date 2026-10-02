"use client";

import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";
  const initialError = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<"admin" | "courier">(
    searchParams.get("role") === "admin" ? "admin" : "courier"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError === "account_deactivated"
      ? "Akun Anda dinonaktifkan oleh administrator."
      : null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleLoginSubmit = (targetEmail: string, targetPassword: string) => {
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("email", targetEmail);
    formData.append("password", targetPassword);
    if (redirectTo) {
      formData.append("redirectTo", redirectTo);
    }

    startTransition(async () => {
      try {
        const result = await loginAction(null, formData);
        if (!result.success) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          if (result.error) {
            setErrorMessage(result.error);
          }
        } else if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      } catch (err) {
        console.error("Login submission error:", err);
        setErrorMessage("Terjadi kesalahan sistem saat mencoba masuk.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleQuickDemo = (role: "admin" | "courier") => {
    if (role === "admin") {
      setEmail("admin@jetfoodpolman.com");
      setPassword("admin123");
      setActiveTab("admin");
      handleLoginSubmit("admin@jetfoodpolman.com", "admin123");
    } else {
      setEmail("kurir@jetfoodpolman.com");
      setPassword("kurir123");
      setActiveTab("courier");
      handleLoginSubmit("kurir@jetfoodpolman.com", "kurir123");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Role Selection Tabs for UX clarity */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("courier");
            if (!email || email === "admin@jetfoodpolman.com") {
              setEmail("kurir@jetfoodpolman.com");
              setPassword("kurir123");
            }
          }}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "courier"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Truck className="h-4 w-4" />
          Kurir Lapangan
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("admin");
            if (!email || email === "kurir@jetfoodpolman.com") {
              setEmail("admin@jetfoodpolman.com");
              setPassword("admin123");
            }
          }}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "admin"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Administrator
        </button>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Operasional"
          type="email"
          name="email"
          placeholder={
            activeTab === "admin"
              ? "admin@jetfoodpolman.com"
              : "kurir@jetfoodpolman.com"
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />

        <div className="relative">
          <Input
            label="Kata Sandi"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          variant={activeTab === "admin" ? "secondary" : "primary"}
          isLoading={isPending}
          className="w-full mt-2 font-semibold"
          size="lg"
        >
          {isPending
            ? "Memverifikasi..."
            : `Masuk sebagai ${activeTab === "admin" ? "Admin" : "Kurir"}`}
        </Button>
      </form>

      {/* 1-Click Quick Demo Login Section */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1 text-orange-600 font-bold">
            <Zap className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            Akses Demo Cepat (1-Klik)
          </span>
          <span className="text-[10px] text-slate-400">Localhost Mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickDemo("admin")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
              Demo Admin
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              admin@jetfoodpolman.com
            </span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickDemo("courier")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-orange-200 bg-orange-50/60 hover:bg-orange-100/60 hover:border-orange-300 text-left transition-colors cursor-pointer"
          >
            <span className="text-xs font-bold text-orange-700 flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-orange-600" />
              Demo Kurir
            </span>
            <span className="text-[10px] text-orange-600/80 mt-0.5">
              kurir@jetfoodpolman.com
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
