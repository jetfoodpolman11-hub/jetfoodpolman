"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

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

/**
 * Fetch package types.
 * Admin can fetch all; Couriers can only fetch active package types.
 */
export async function getPackageTypes(options?: {
  activeOnly?: boolean;
}): Promise<PackageTypeItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("package_types")
    .select("id, name, description, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching package types:", error);
    return [];
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
