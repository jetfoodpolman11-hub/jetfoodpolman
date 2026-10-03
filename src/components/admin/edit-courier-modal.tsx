"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourierAction, type CourierWithProfile } from "@/actions/couriers";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Camera,
  Upload,
  User,
} from "lucide-react";

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

function compressImageToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const size = 400;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function EditCourierForm({ courier, onClose, onSuccess }: EditFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(courier.fullName || "");
  const [phone, setPhone] = useState(courier.phone || "");
  const [courierCode, setCourierCode] = useState(courier.courierCode || "");
  const [vehicleType, setVehicleType] = useState(courier.vehicleType || "Motor");
  const [plateNumber, setPlateNumber] = useState(courier.plateNumber || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    courier.avatarUrl || null
  );
  const [newAvatarDataUrl, setNewAvatarDataUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Format file harus berupa gambar (JPG, PNG, atau WebP).");
      return;
    }

    setError(null);
    try {
      const compressed = await compressImageToSquareDataUrl(file);
      setAvatarPreview(compressed);
      setNewAvatarDataUrl(compressed);
    } catch {
      setError("Gagal memproses foto profil.");
    }
  };

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

    if (newAvatarDataUrl) {
      formData.append("avatarDataUrl", newAvatarDataUrl);
    }

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
        {/* Profile Photo Upload Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
            Foto Profil Kurir (Tersimpan di Supabase)
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-full border-2 border-orange-500 bg-white overflow-hidden flex items-center justify-center shadow-xs">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-slate-300" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="edit-courier-avatar-input"
              />
              <label
                htmlFor="edit-courier-avatar-input"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-2xs"
              >
                <Camera className="h-3.5 w-3.5 text-orange-400" />
                <span>
                  {avatarPreview ? "Ganti Foto Profil" : "Upload Foto Profil"}
                </span>
              </label>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Upload className="h-3 w-3 text-slate-400 shrink-0" />
                <span>Pilih foto baru dari HP atau komputer Anda.</span>
              </p>
            </div>
          </div>
        </div>

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
      description={`Perbarui profil & foto kurir ${courier.fullName} (${courier.email})`}
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
