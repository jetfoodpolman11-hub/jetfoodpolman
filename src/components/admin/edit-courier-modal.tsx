"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourierAction, type CourierWithProfile } from "@/actions/couriers";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";

interface EditCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: CourierWithProfile | null;
  onSuccess?: () => void;
}

interface EditFormProps {
  courier: CourierWithProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditCourierForm({ courier, onClose, onSuccess }: EditFormProps) {
  const [fullName, setFullName] = useState(courier.fullName || "");
  const [phone, setPhone] = useState(courier.phone || "");
  const [courierCode, setCourierCode] = useState(courier.courierCode || "");
  const [vehicleType, setVehicleType] = useState(courier.vehicleType || "Motor");
  const [plateNumber, setPlateNumber] = useState(courier.plateNumber || "");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    formData.append("courierCode", courierCode);
    formData.append("vehicleType", vehicleType);
    formData.append("plateNumber", plateNumber);

    startTransition(async () => {
      const res = await updateCourierAction(courier.id, courier.userId, formData);
      if (!res.success) {
        setError(res.error || "Gagal memperbarui data kurir");
      } else {
        setSuccessMsg(res.message || "Data kurir berhasil diperbarui.");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      }
    });
  };

  return (
    <>
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
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Kode Kurir *"
            value={courierCode}
            onChange={(e) => setCourierCode(e.target.value.toUpperCase())}
            required
          />
        </div>

        <Input
          label="Nomor WhatsApp / HP"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

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
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </>
  );
}

export function EditCourierModal({
  isOpen,
  onClose,
  courier,
  onSuccess,
}: EditCourierModalProps) {
  if (!courier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Data Kurir"
      description={`Perbarui profil kurir ${courier.fullName} (${courier.email})`}
    >
      <EditCourierForm
        key={courier.id}
        courier={courier}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
