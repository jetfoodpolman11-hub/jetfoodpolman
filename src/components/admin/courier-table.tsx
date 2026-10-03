"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateCourierModal } from "./create-courier-modal";
import { EditCourierModal } from "./edit-courier-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import {
  toggleCourierStatusAction,
  deleteCourierAction,
  type CourierWithProfile,
} from "@/actions/couriers";
import {
  UserPlus,
  Search,
  Edit2,
  KeyRound,
  PowerOff,
  Power,
  Trash2,
  Phone,
  Mail,
  Truck,
} from "lucide-react";

interface CourierTableProps {
  initialCouriers: CourierWithProfile[];
}

export function CourierTable({ initialCouriers }: CourierTableProps) {
  const router = useRouter();
  const couriers = initialCouriers;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourierForEdit, setSelectedCourierForEdit] =
    useState<CourierWithProfile | null>(null);
  const [selectedCourierForReset, setSelectedCourierForReset] =
    useState<CourierWithProfile | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = (courier: CourierWithProfile) => {
    const newStatus = courier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmMsg =
      newStatus === "INACTIVE"
        ? `Apakah Anda yakin ingin menonaktifkan akun kurir ${courier.fullName}? Kurir tidak akan dapat login.`
        : `Aktifkan kembali akun kurir ${courier.fullName}?`;

    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      await toggleCourierStatusAction(courier.id, courier.userId, newStatus);
      router.refresh();
    });
  };

  const handleDeleteCourier = (courier: CourierWithProfile) => {
    const confirmMsg = `HAPUS PERMANEN KURIR?\n\nApakah Anda yakin ingin menghapus akun kurir "${courier.fullName}" (${courier.courierCode}) beserta seluruh riwayat absensi dan laporannya dari database Supabase?\n\nTindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await deleteCourierAction(courier.id, courier.userId);
      if (!res.success && res.error) {
        window.alert(res.error);
      }
      router.refresh();
    });
  };

  const filtered = couriers.filter((c) => {
    const matchesStatus =
      statusFilter === "ALL" || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.fullName.toLowerCase().includes(q) ||
      c.courierCode.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Add Courier Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kurir berdasarkan nama, kode, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Saja</option>
            <option value="INACTIVE">Nonaktif Saja</option>
          </select>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 font-semibold shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Kurir</span>
        </Button>
      </div>

      {/* Courier Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Kurir</th>
              <th className="px-5 py-3.5">Kontak</th>
              <th className="px-5 py-3.5">Kendaraan</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  Tidak ada data kurir yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {courier.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={courier.avatarUrl}
                          alt={courier.fullName}
                          className="h-10 w-10 rounded-full object-cover border border-orange-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                          {courier.courierCode.slice(-3)}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {courier.fullName}
                        </span>
                        <span className="text-xs text-orange-600 font-medium">
                          {courier.courierCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{courier.email}</span>
                    </div>
                    {courier.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{courier.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      <span>{courier.vehicleType || "Motor"}</span>
                    </div>
                    {courier.plateNumber && (
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        {courier.plateNumber}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {courier.status === "ACTIVE" ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="neutral">Nonaktif</Badge>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCourierForEdit(courier)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit data kurir"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCourierForReset(courier)}
                        className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Reset kata sandi"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(courier)}
                        disabled={isPending}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          courier.status === "ACTIVE"
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={
                          courier.status === "ACTIVE"
                            ? "Nonaktifkan kurir"
                            : "Aktifkan kurir"
                        }
                      >
                        {courier.status === "ACTIVE" ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCourier(courier)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus permanen kurir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Courier Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Tidak ada data kurir yang ditemukan.
          </div>
        ) : (
          filtered.map((courier) => (
            <div
              key={courier.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {courier.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={courier.avatarUrl}
                      alt={courier.fullName}
                      className="h-11 w-11 rounded-full object-cover border border-orange-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                      {courier.courierCode.slice(-3)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {courier.fullName}
                    </h3>
                    <span className="text-xs font-semibold text-orange-600">
                      {courier.courierCode}
                    </span>
                  </div>
                </div>
                {courier.status === "ACTIVE" ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="neutral">Nonaktif</Badge>
                )}
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{courier.email}</span>
                </div>
                {courier.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{courier.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {courier.vehicleType || "Motor"}{" "}
                    {courier.plateNumber && `(${courier.plateNumber})`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCourierForEdit(courier)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCourierForReset(courier)}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                  Sandi
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggleStatus(courier)}
                  disabled={isPending}
                >
                  {courier.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteCourier(courier)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Hapus
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateCourierModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <EditCourierModal
        isOpen={!!selectedCourierForEdit}
        onClose={() => setSelectedCourierForEdit(null)}
        courier={selectedCourierForEdit}
        onSuccess={() => router.refresh()}
      />

      <ResetPasswordModal
        isOpen={!!selectedCourierForReset}
        onClose={() => setSelectedCourierForReset(null)}
        courier={selectedCourierForReset}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
