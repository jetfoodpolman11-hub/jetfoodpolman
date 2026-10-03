"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourierAction } from "@/actions/couriers";
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Trash2,
  User,
} from "lucide-react";

interface CreateCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Helper: Resize and compress selected image (from PC/Laptop/HP) into a clean 400x400 square JPEG Data URL
 */
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
        // Center-crop square
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

export function CreateCourierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCourierModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [courierCode, setCourierCode] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Motor");
  const [plateNumber, setPlateNumber] = useState("");
  const [password, setPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    setAvatarPreview(null);
    setSelectedFile(null);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Format file harus berupa gambar (JPG, PNG, atau WebP).");
      return;
    }

    setError(null);
    setSelectedFile(file);
    try {
      const compressedDataUrl = await compressImageToSquareDataUrl(file);
      setAvatarPreview(compressedDataUrl);
    } catch {
      setError("Gagal memproses foto profil. Coba pilih foto lain.");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    if (avatarPreview) {
      formData.append("avatarDataUrl", avatarPreview);
    } else if (selectedFile) {
      formData.append("avatarFile", selectedFile);
    }

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
      description="Daftarkan akun kurir lapangan baru beserta foto profil ke Supabase."
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
                  alt="Preview Foto Kurir"
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
                id="create-courier-avatar-input"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="create-courier-avatar-input"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                >
                  <Camera className="h-3.5 w-3.5 text-orange-400" />
                  <span>
                    {avatarPreview ? "Ganti Foto" : "Upload Foto (HP / Laptop)"}
                  </span>
                </label>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Upload className="h-3 w-3 text-slate-400 shrink-0" />
                <span>
                   Mendukung foto kamera HP atau galeri komputer (JPG, PNG, WebP).
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nama Lengkap *"
            placeholder="Contoh: Muhammad Alwi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Kode Kurir (Unik) *"
            placeholder="Contoh: JF0001 atau JF-001"
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
