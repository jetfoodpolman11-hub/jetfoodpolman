"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/constants";

export interface PackageTypeItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const fallbackPackageTypes: PackageTypeItem[] = [
  { id: "pkg-reguler-id", name: "Reguler", description: "Pengiriman standar Polewali Mandar", isActive: true, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
  { id: "pkg-express-id", name: "Express", description: "Pengiriman prioritas same-day", isActive: true, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
  { id: "pkg-dokumen-id", name: "Dokumen", description: "Pengiriman surat & arsip penting", isActive: true, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
  { id: "pkg-cargo-id", name: "Cargo", description: "Pengiriman barang berat / volume besar", isActive: true, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
  { id: "pkg-kuliner-id", name: "Makanan & Minuman", description: "Pengantaran kuliner dan konsumsi", isActive: true, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
];

/**
 * Fetch package types.
 * Admin can fetch all; Couriers can only fetch active package types.
 */
export async function getPackageTypes(options?: {
  activeOnly?: boolean;
}): Promise<PackageTypeItem[]> {
  const session = await requireAuth();
  const isAdmin = session.profile?.role === ROLES.ADMIN;
  const enforceActiveOnly = !isAdmin || Boolean(options?.activeOnly);

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    return enforceActiveOnly
      ? fallbackPackageTypes.filter((p) => p.isActive)
      : fallbackPackageTypes;
  }

  const supabase = await createClient();

  let query = supabase
    .from("package_types")
    .select("id, name, description, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (enforceActiveOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    if (error) console.error("Error fetching package types:", error);
    return enforceActiveOnly
      ? fallbackPackageTypes.filter((p) => p.isActive)
      : fallbackPackageTypes;
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Server Action: Create new package type (Admin only)
 */
export async function createPackageTypeAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Nama jenis paket wajib diisi." };
  }

  const supabase = await createClient();

  // Check duplicate name
  const { data: existing } = await supabase
    .from("package_types")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Jenis paket "${name}" sudah ada di sistem.`,
    };
  }

  const { error } = await supabase.from("package_types").insert({
    name,
    description,
    is_active: true,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/master-data");
  return {
    success: true,
    message: `Jenis paket "${name}" berhasil ditambahkan.`,
  };
}

/**
 * Server Action: Update package type (Admin only)
 */
export async function updatePackageTypeAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Nama jenis paket tidak boleh kosong." };
  }

  const supabase = await createClient();

  // Check duplicate name conflict
  const { data: conflict } = await supabase
    .from("package_types")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();

  if (conflict) {
    return {
      success: false,
      error: `Nama jenis paket "${name}" sudah digunakan paket lain.`,
    };
  }

  const { error } = await supabase
    .from("package_types")
    .update({ name, description })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/master-data");
  return { success: true, message: "Jenis paket berhasil diperbarui." };
}

/**
 * Server Action: Toggle active / inactive status for package type (Admin only)
 */
export async function togglePackageTypeStatusAction(
  id: string,
  currentStatus: boolean
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const newStatus = !currentStatus;

  const { error } = await supabase
    .from("package_types")
    .update({ is_active: newStatus })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/master-data");
  return {
    success: true,
    message: `Status paket berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`,
  };
}
