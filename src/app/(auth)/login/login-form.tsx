"use client";

import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, Eye, EyeOff, AlertCircle } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
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

  return (
    <div className="w-full space-y-6">
      {/* Role Selection Tabs for UX clarity */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("courier")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
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
          onClick={() => setActiveTab("admin")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
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
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
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
          {isPending ? "Memverifikasi..." : `Masuk sebagai ${activeTab === "admin" ? "Admin" : "Kurir"}`}
        </Button>
      </form>
    </div>
  );
}
