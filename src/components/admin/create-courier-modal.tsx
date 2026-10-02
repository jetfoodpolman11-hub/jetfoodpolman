"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourierAction } from "@/actions/couriers";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

interface CreateCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCourierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCourierModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [courierCode, setCourierCode] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Motor");
  const [plateNumber, setPlateNumber] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setCourierCode("");
    setPhone("");
    setVehicleType("Motor");
    setPlateNumber("");
    setPassword("");
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("courierCode", courierCode);
    formData.append("phone", phone);
    formData.append("vehicleType", vehicleType);
    formData.append("plateNumber", plateNumber);
    formData.append("password", password);

    startTransition(async () => {
      const res = await createCourierAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal menambahkan kurir");
      } else {
        setSuccessMsg(res.message || "Kurir berhasil ditambahkan.");
        setTimeout(() => {
          resetForm();
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Tambah Kurir Baru"
      description="Daftarkan akun kurir lapangan baru. Role otomatis diset sebagai KURIR."
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nama Lengkap *"
            placeholder="Contoh: Muhammad Ali"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Kode Kurir (Unik) *"
            placeholder="Contoh: JF-001"
            value={courierCode}
            onChange={(e) => setCourierCode(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Akun *"
            type="email"
            placeholder="kurir@jetfoodpolman.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Nomor WhatsApp / HP"
            type="tel"
            placeholder="081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jenis Kendaraan
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="Motor">Sepeda Motor</option>
              <option value="Mobil">Mobil / Pickup</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <Input
            label="Plat Nomor Kendaraan"
            placeholder="DC 1234 XX"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
          />
        </div>

        <Input
          label="Kata Sandi Awal *"
          type="password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Simpan Kurir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
