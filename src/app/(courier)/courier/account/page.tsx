import { requireCourier } from "@/lib/auth/guards";
import { BiometricCard } from "@/components/courier/biometric-card";
import { LogoutButton } from "@/components/shared/logout-button";
import {
  User,
  Mail,
  Phone,
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Akun Kurir — JetFood Polman",
  description: "Informasi profil dan penugasan kurir JetFood Polman",
};

export default async function CourierAccountPage() {
  const session = await requireCourier();

  const fullName = session.profile?.fullName || "Kurir Lapangan";
  const email = session.user.email || "—";
  const phone = session.profile?.phone || "0812-3456-7890";
  const courierCode = session.courier?.courierCode || "JF-KURIR";
  const vehicleType = session.courier?.vehicleType || "Sepeda Motor";
  const plateNumber = session.courier?.plateNumber || "DC 1234 XX";
  const isActive = session.profile?.isActive !== false;
  const avatarUrl =
    session.profile?.avatarUrl || session.courier?.avatarUrl || null;

  return (
    <div className="space-y-5 pb-8 font-sans">
      {/* 1. Profile Header Card */}
      <div className="rounded-3xl bg-[#DC0000] p-6 text-white shadow-[0_8px_24px_rgba(220,0,0,0.22)] relative overflow-hidden border border-red-700/40">
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          {/* Avatar with White Ring Accent */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-2 border-white p-1 flex items-center justify-center bg-white/15 shadow-md overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[#DC0000] font-black text-2xl">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#DC0000]" title="Kurir Aktif" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {fullName}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="rounded-full bg-white px-3 py-0.5 text-xs font-mono font-black tracking-wider text-slate-950 uppercase shadow-xs">
                {courierCode}
              </span>
              <span className="text-xs text-white/90 font-semibold">
                Kurir Lapangan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal & Assignment Details (Read-Only) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-red-600" />
            <span>Informasi Personal Kurir</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
            Read-Only
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Nama Lengkap */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Nama Lengkap</span>
            <span className="font-bold text-slate-900">{fullName}</span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>Email Akun</span>
            </span>
            <span className="font-semibold text-slate-900 font-mono text-[11px]">{email}</span>
          </div>

          {/* Nomor HP */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>No. WhatsApp / HP</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">{phone}</span>
          </div>

          {/* Wilayah Tugas */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-red-600" />
              <span>Wilayah Operasional</span>
            </span>
            <span className="font-bold text-slate-900">Polewali Mandar (Sulbar)</span>
          </div>
        </div>
      </div>

      {/* 3. Vehicle & Fleet Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-red-600" />
            <span>Armada Pengantaran</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Terverifikasi</span>
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Tipe Kendaraan */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Jenis Kendaraan</span>
            <span className="font-bold text-slate-900">{vehicleType}</span>
          </div>

          {/* Nomor Plat */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-slate-500 font-medium">Nomor Plat Polisi</span>
            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded tracking-wider">
              {plateNumber}
            </span>
          </div>

          {/* Status Penugasan */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <span className="text-slate-500 font-medium">Status Keanggotaan</span>
            <span className="font-bold text-emerald-600">
              {isActive ? "Kurir Aktif Lapangan" : "Nonaktif"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Biometric Card (Sidik Jari HP) */}
      <BiometricCard courierCode={courierCode} courierName={fullName} />

      {/* 5. Policy Notice Box */}
      <div className="rounded-2xl bg-slate-100/90 border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3">
        <div className="h-7 w-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 text-slate-700 mt-0.5">
          <Lock className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            Pengelolaan Data Terpusat
          </span>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Data profil, plat kendaraan, dan akun kurir dikelola secara terpusat oleh Administrator di Portal Admin. Untuk perubahan data, silakan hubungi admin operasional JetFood Polman.
          </p>
        </div>
      </div>

      {/* 6. Logout Button */}
      <div className="pt-2">
        <div className="w-full flex items-center justify-center">
          <LogoutButton label="Keluar dari Akun Kurir" />
        </div>
      </div>
    </div>
  );
}
