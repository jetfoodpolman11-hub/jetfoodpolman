"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  createPackageTypeAction,
  updatePackageTypeAction,
  togglePackageTypeStatusAction,
  type PackageTypeItem,
} from "@/actions/package-types";
import { Plus, Edit2, PowerOff, Power, Package, AlertCircle, CheckCircle2 } from "lucide-react";

interface PackageTypesManagerProps {
  initialItems: PackageTypeItem[];
}

export function PackageTypesManager({ initialItems }: PackageTypesManagerProps) {
  const router = useRouter();
  const items = initialItems;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackageTypeItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenAdd = () => {
    setName("");
    setDescription("");
    setError(null);
    setSuccessMsg(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: PackageTypeItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setError(null);
    setSuccessMsg(null);
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    startTransition(async () => {
      const res = await createPackageTypeAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal menambahkan paket");
      } else {
        setSuccessMsg(res.message || "Paket berhasil dibuat.");
        setTimeout(() => {
          setIsAddOpen(false);
          router.refresh();
        }, 1000);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    startTransition(async () => {
      const res = await updatePackageTypeAction(editingItem.id, formData);
      if (!res.success) {
        setError(res.error || "Gagal memperbarui paket");
      } else {
        setSuccessMsg(res.message || "Paket berhasil diperbarui.");
        setTimeout(() => {
          setEditingItem(null);
          router.refresh();
        }, 1000);
      }
    });
  };

  const handleToggleStatus = (item: PackageTypeItem) => {
    const actionWord = item.isActive ? "menonaktifkan" : "mengaktifkan";
    if (!window.confirm(`Apakah Anda yakin ingin ${actionWord} jenis paket "${item.name}"?`)) {
      return;
    }

    startTransition(async () => {
      await togglePackageTypeStatusAction(item.id, item.isActive);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Daftar Jenis Paket Operasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jenis paket yang berstatus Aktif akan otomatis muncul di form laporan kurir.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center gap-1.5 font-semibold">
          <Plus className="h-4 w-4" />
          <span>Tambah Jenis Paket</span>
        </Button>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Nama Paket</th>
              <th className="px-5 py-3.5">Keterangan</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                  Belum ada jenis paket yang ditambahkan.
                </td>
              </tr>
            ) : (
              items.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-900">{pkg.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">
                    {pkg.description || "—"}
                  </td>
                  <td className="px-5 py-4">
                    {pkg.isActive ? (
                      <Badge variant="success">Aktif (Bisa Dipilih)</Badge>
                    ) : (
                      <Badge variant="neutral">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit jenis paket"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(pkg)}
                        disabled={isPending}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          pkg.isActive
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={pkg.isActive ? "Nonaktifkan paket" : "Aktifkan paket"}
                      >
                        {pkg.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Jenis Paket"
        description="Buat kategori paket pengiriman baru untuk operasional JetFood."
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

        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <Input
            label="Nama Jenis Paket *"
            placeholder="Contoh: Frozen Food / Kuliner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan penanganan paket..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Simpan Paket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Jenis Paket"
        description="Perbarui informasi jenis paket."
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

        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <Input
            label="Nama Jenis Paket *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
