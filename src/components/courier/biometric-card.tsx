"use client";

import { useState, useEffect } from "react";
import {
  checkBiometricSupport,
  getStoredBiometricStatus,
  registerDeviceBiometric,
  disableDeviceBiometric,
  BiometricStatus,
} from "@/lib/auth/biometric";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface BiometricCardProps {
  courierCode: string;
  courierName: string;
}

export function BiometricCard({ courierCode, courierName }: BiometricCardProps) {
  const [status, setStatus] = useState<BiometricStatus>({
    isSupported: false,
    isEnabled: false,
    registeredCourierCode: null,
    registeredCourierName: null,
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function init() {
      const supported = await checkBiometricSupport();
      const stored = getStoredBiometricStatus();
      setStatus({
        ...stored,
        isSupported: supported,
      });
    }
    init();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setFeedback(null);

    const result = await registerDeviceBiometric(courierCode, courierName);
    setLoading(false);

    if (result.success) {
      setStatus(getStoredBiometricStatus());
      setFeedback({
        type: "success",
        message: "Sidik jari berhasil diaktifkan pada perangkat ini! Saat login berikutnya, Anda cukup menyentuh sensor sidik jari.",
      });
    } else {
      setFeedback({
        type: "error",
        message: result.error || "Gagal mengaktifkan sidik jari.",
      });
    }
  };

  const handleDisable = () => {
    disableDeviceBiometric();
    setStatus(getStoredBiometricStatus());
    setFeedback({
      type: "success",
      message: "Fitur login sidik jari dinonaktifkan dari perangkat ini.",
    });
  };

  return (
    <Card className="border-red-100 bg-gradient-to-r from-red-50/40 via-white to-white shadow-xs">
      <CardHeader className="pb-3 border-b border-red-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Fingerprint className="h-4 w-4" />
            </div>
            <span>Login Cepat Sidik Jari (Biometrik)</span>
          </CardTitle>

          {status.isEnabled ? (
            <Badge variant="success" className="text-[10px] font-bold">
              Aktif di HP Ini
            </Badge>
          ) : (
            <Badge variant="neutral" className="text-[10px]">
              Belum Aktif
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          {status.isEnabled
            ? `Perangkat ini telah terhubung dengan akun ${courierName} (${courierCode}). Anda dapat masuk ke aplikasi kurir langsung menggunakan sensor sidik jari tanpa mengetik kode.`
            : "Aktifkan autentikasi sidik jari di smartphone Anda untuk login instan 1-sentuhan di lapangan tanpa harus mengetik kode kurir lagi."}
        </p>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="pt-1 flex items-center gap-2">
          {status.isEnabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisable}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Nonaktifkan di HP Ini</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={loading}
              onClick={handleEnable}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-xs"
            >
              <Fingerprint className="h-4 w-4" />
              <span>{loading ? "Memproses Sidik Jari..." : "Aktifkan Sidik Jari Sekarang"}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
