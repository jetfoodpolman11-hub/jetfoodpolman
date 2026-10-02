"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction, loginWithBiometricAction } from "@/actions/auth";
import {
  getStoredBiometricStatus,
  checkBiometricSupport,
  authenticateDeviceBiometric,
  BiometricStatus,
} from "@/lib/auth/biometric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Truck,
  ShieldCheck,
  Fingerprint,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";
  const initialError = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<"courier" | "admin">(
    searchParams.get("role") === "admin" ? "admin" : "courier"
  );

  // Form Fields
  const [identifier, setIdentifier] = useState(
    searchParams.get("role") === "admin" ? "admin@jetfoodpolman.com" : "JF-001"
  );
  const [password, setPassword] = useState(
    searchParams.get("role") === "admin" ? "admin123" : "kurir123"
  );
  const [showPassword, setShowPassword] = useState(false);

  // Biometric states
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    isSupported: false,
    isEnabled: false,
    registeredCourierCode: null,
    registeredCourierName: null,
  });
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError === "account_deactivated"
      ? "Akun Anda dinonaktifkan oleh administrator."
      : null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadBiometrics() {
      const supported = await checkBiometricSupport();
      const status = getStoredBiometricStatus();
      setBiometricStatus({
        ...status,
        isSupported: supported,
      });
    }
    loadBiometrics();
  }, []);

  // Standard Login Submit
  const handleLoginSubmit = (targetId: string, targetPass: string) => {
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("identifier", targetId);
    formData.append("password", targetPass);
    if (redirectTo) {
      formData.append("redirectTo", redirectTo);
    }

    startTransition(async () => {
      try {
        const result = await loginAction(null, formData);
        if (!result.success) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          if (result.error) setErrorMessage(result.error);
        } else if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      } catch (err) {
        console.error("Login submission error:", err);
        setErrorMessage("Terjadi kendala sistem saat memproses login.");
      }
    });
  };

  // Biometric 1-Touch Fingerprint Login
  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setBiometricLoading(true);

    try {
      const bioAuth = await authenticateDeviceBiometric();
      if (!bioAuth.success || !bioAuth.courierCode) {
        setErrorMessage(bioAuth.error || "Autentikasi sidik jari tidak berhasil.");
        setBiometricLoading(false);
        return;
      }

      startTransition(async () => {
        const result = await loginWithBiometricAction(bioAuth.courierCode!);
        if (!result.success) {
          setErrorMessage(result.error || "Gagal masuk dengan sidik jari.");
        } else if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      });
    } catch {
      setErrorMessage("Sensor sidik jari tidak dapat diakses.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLoginSubmit(identifier, password);
  };

  // Switch role tabs
  const handleSwitchTab = (tab: "courier" | "admin") => {
    setActiveTab(tab);
    setErrorMessage(null);
    setFieldErrors({});
    if (tab === "courier") {
      setIdentifier("JF-001");
      setPassword("kurir123");
    } else {
      setIdentifier("admin@jetfoodpolman.com");
      setPassword("admin123");
    }
  };

  const isCourierBioAvailable =
    activeTab === "courier" &&
    biometricStatus.isEnabled &&
    !showManualForm;

  return (
    <div className="w-full space-y-5">
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => handleSwitchTab("courier")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "courier"
              ? "bg-red-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Kurir Lapangan</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("admin")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "admin"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Administrator</span>
        </button>
      </div>

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* FAST BIOMETRIC (FINGERPRINT) CARD (If registered on this device) */}
      {isCourierBioAvailable ? (
        <div className="p-6 rounded-2xl border-2 border-red-500/20 bg-gradient-to-b from-red-50/70 to-white text-center space-y-4 shadow-sm">
          <div className="relative mx-auto w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md animate-pulse">
            <Fingerprint className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
              Login Cepat Sidik Jari
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {biometricStatus.registeredCourierName || "Kurir JetFood"}
            </h3>
            <span className="inline-block mt-1 font-mono text-xs font-bold text-slate-700 bg-red-100/70 px-2 py-0.5 rounded">
              Kode: {biometricStatus.registeredCourierCode}
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sentuh sensor sidik jari smartphone Anda untuk langsung masuk ke dashboard kurir.
          </p>

          <Button
            type="button"
            disabled={biometricLoading || isPending}
            onClick={handleBiometricLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 text-xs sm:text-sm rounded-xl gap-2 shadow-xs cursor-pointer"
          >
            <Fingerprint className="h-5 w-5" />
            <span>
              {biometricLoading || isPending
                ? "Memverifikasi Sidik Jari..."
                : "Sentuh Sidik Jari Sekarang"}
            </span>
          </Button>

          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold block mx-auto pt-1"
          >
            Masuk dengan Kode / Sandi Manual
          </button>
        </div>
      ) : (
        /* STANDARD MANUAL LOGIN FORM */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier Field: Kode Kurir vs Email Admin */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{activeTab === "courier" ? "Kode Kurir Lapangan" : "Email Administrator"}</span>
              {activeTab === "courier" && (
                <span className="text-[10px] text-red-600 font-semibold uppercase">
                  Gunakan Kode Kurir
                </span>
              )}
            </label>
            <Input
              type={activeTab === "courier" ? "text" : "email"}
              placeholder={activeTab === "courier" ? "Contoh: JF-001" : "admin@jetfoodpolman.com"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isPending}
              className={`text-xs h-10 ${
                activeTab === "courier" ? "font-mono font-bold uppercase tracking-wider" : ""
              } ${fieldErrors.identifier ? "border-rose-400" : ""}`}
              required
            />
            {fieldErrors.identifier && (
              <span className="text-[11px] text-rose-600 block mt-1">
                {fieldErrors.identifier}
              </span>
            )}
            {activeTab === "courier" && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Kode resmi yang diberikan Admin saat pendaftaran akun.
              </span>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi / PIN
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className={`text-xs h-10 pr-10 ${fieldErrors.password ? "border-rose-400" : ""}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] text-rose-600 block mt-1">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className={`w-full font-bold h-10 text-xs sm:text-sm rounded-xl gap-2 shadow-xs cursor-pointer ${
              activeTab === "courier"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {isPending ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>{activeTab === "courier" ? "Masuk Portal Kurir" : "Masuk Portal Admin"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* If biometric was enabled but courier switched to manual, allow switching back */}
          {activeTab === "courier" && biometricStatus.isEnabled && showManualForm && (
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="text-[11px] text-red-600 hover:text-red-800 font-bold block mx-auto pt-1 flex items-center gap-1 justify-center"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              <span>Gunakan Login Sidik Jari</span>
            </button>
          )}

          {/* Quick Demo Credentials Bar for Easy Testing */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Akses Cepat Pengujian (Mode Demo):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeTab === "courier" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("JF-001");
                      setPassword("kurir123");
                      handleLoginSubmit("JF-001", "kurir123");
                    }}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 text-center transition-colors"
                  >
                    ⚡ Kurir Ali (JF-001)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("JF-002");
                      setPassword("kurir123");
                      handleLoginSubmit("JF-002", "kurir123");
                    }}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 text-center transition-colors"
                  >
                    ⚡ Kurir Budi (JF-002)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier("admin@jetfoodpolman.com");
                    setPassword("admin123");
                    handleLoginSubmit("admin@jetfoodpolman.com", "admin123");
                  }}
                  className="col-span-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 text-center transition-colors"
                >
                  ⚡ Super Admin (admin@jetfoodpolman.com)
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
