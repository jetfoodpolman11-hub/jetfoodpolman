"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCreateCourierInput } from "@/lib/validations/courier";

export interface CourierWithProfile {
  id: string;
  userId: string;
  courierCode: string;
  vehicleType: string | null;
  plateNumber: string | null;
  status: "ACTIVE" | "INACTIVE";
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const MOCK_COURIERS: CourierWithProfile[] = [
  {
    id: "mock-courier-rec-id",
    userId: "mock-courier-user-id",
    courierCode: "JF-001",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 1234 XX",
    status: "ACTIVE",
    fullName: "Kurir Lapangan Ali",
    email: "kurir@jetfood.id",
    phone: "081234567890",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "mock-courier-rec-2",
    userId: "mock-courier-user-2",
    courierCode: "JF-002",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 5678 YY",
    status: "ACTIVE",
    fullName: "Kurir Lapangan Budi",
    email: "budi@jetfood.id",
    phone: "081234567891",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "mock-courier-rec-3",
    userId: "mock-courier-user-3",
    courierCode: "JF-003",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 9012 ZZ",
    status: "ACTIVE",
    fullName: "Kurir Lapangan Citra",
    email: "citra@jetfood.id",
    phone: "081234567892",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

/**
 * Fetch all couriers with their associated profiles
 */
export async function getCouriers(options?: {
  search?: string;
  status?: string;
}): Promise<CourierWithProfile[]> {
  await requireAdmin();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    let list = [...MOCK_COURIERS];
    if (options?.status && (options.status === "ACTIVE" || options.status === "INACTIVE")) {
      list = list.filter((c) => c.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.courierCode.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  const supabase = await createClient();

  let query = supabase
    .from("couriers")
    .select(`
      id,
      user_id,
      courier_code,
      vehicle_type,
      plate_number,
      status,
      created_at,
      profiles:user_id (
        id,
        full_name,
        email,
        phone,
        is_active
      )
    `)
    .order("created_at", { ascending: false });

  if (options?.status && (options.status === "ACTIVE" || options.status === "INACTIVE")) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching couriers:", error);
    return [];
  }

  const formatted: CourierWithProfile[] = [];

  for (const item of data) {
    // profiles is joined as single object or array depending on PostgREST response
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    if (profile) {
      // If search filter is active, filter by name, code, or email
      if (options?.search) {
        const q = options.search.toLowerCase();
        const matchesName = profile.full_name?.toLowerCase().includes(q);
        const matchesCode = item.courier_code?.toLowerCase().includes(q);
        const matchesEmail = profile.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail) {
          continue;
        }
      }

      formatted.push({
        id: item.id,
        userId: item.user_id,
        courierCode: item.courier_code,
        vehicleType: item.vehicle_type,
        plateNumber: item.plate_number,
        status: item.status,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        isActive: profile.is_active,
        createdAt: item.created_at,
      });
    }
  }

  return formatted;
}

/**
 * Server Action: Create a new courier (Admin only)
 */
export async function createCourierAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const courierCode = (formData.get("courierCode") as string)?.trim().toUpperCase();
  const vehicleType = (formData.get("vehicleType") as string)?.trim() || null;
  const plateNumber = (formData.get("plateNumber") as string)?.trim().toUpperCase() || null;
  const password = formData.get("password") as string;

  // 1. Validation
  const validation = validateCreateCourierInput({
    fullName,
    email,
    phone: phone || undefined,
    courierCode,
    vehicleType: vehicleType || undefined,
    plateNumber: plateNumber || undefined,
    password,
  });

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError || "Data tidak valid" };
  }

  const supabase = await createClient();

  // 2. Check duplicate email in profiles
  const { data: existingEmail } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return {
      success: false,
      error: `Email ${email} sudah terdaftar di sistem.`,
    };
  }

  // 3. Check duplicate courier_code in couriers
  const { data: existingCode } = await supabase
    .from("couriers")
    .select("id")
    .eq("courier_code", courierCode)
    .maybeSingle();

  if (existingCode) {
    return {
      success: false,
      error: `Kode kurir ${courierCode} sudah digunakan. Gunakan kode lain.`,
    };
  }

  try {
    const adminClient = createAdminClient();

    // 4. Create user in Supabase Auth via admin API
    const { data: authUser, error: authCreateError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authCreateError || !authUser.user) {
      return {
        success: false,
        error: authCreateError?.message || "Gagal membuat akun autentikasi kurir.",
      };
    }

    const newUserId = authUser.user.id;

    // 5. Insert profile into profiles table (Role is strictly 'KURIR')
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: newUserId,
      role: "KURIR",
      full_name: fullName,
      email,
      phone,
      is_active: true,
    });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(newUserId);
      return {
        success: false,
        error: `Gagal menyimpan profil kurir: ${profileError.message}`,
      };
    }

    // 6. Insert courier metadata into couriers table
    const { error: courierError } = await adminClient.from("couriers").insert({
      user_id: newUserId,
      courier_code: courierCode,
      vehicle_type: vehicleType,
      plate_number: plateNumber,
      status: "ACTIVE",
    });

    if (courierError) {
      // Clean up on failure
      await adminClient.from("profiles").delete().eq("id", newUserId);
      await adminClient.auth.admin.deleteUser(newUserId);
      return {
        success: false,
        error: `Gagal menyimpan data kurir: ${courierError.message}`,
      };
    }

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Kurir ${fullName} (${courierCode}) berhasil didaftarkan.`,
    };
  } catch (err: unknown) {
    console.error("Exception during courier creation:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan sistem saat membuat kurir.",
    };
  }
}

/**
 * Server Action: Update courier details
 */
export async function updateCourierAction(
  courierId: string,
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const courierCode = (formData.get("courierCode") as string)?.trim().toUpperCase();
  const vehicleType = (formData.get("vehicleType") as string)?.trim() || null;
  const plateNumber = (formData.get("plateNumber") as string)?.trim().toUpperCase() || null;

  if (!fullName) {
    return { success: false, error: "Nama lengkap wajib diisi" };
  }
  if (!courierCode) {
    return { success: false, error: "Kode kurir wajib diisi" };
  }

  const supabase = await createClient();

  // Check unique courier_code conflict with other couriers
  const { data: conflictCode } = await supabase
    .from("couriers")
    .select("id")
    .eq("courier_code", courierCode)
    .neq("id", courierId)
    .maybeSingle();

  if (conflictCode) {
    return {
      success: false,
      error: `Kode kurir ${courierCode} sudah digunakan oleh kurir lain.`,
    };
  }

  // Update profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
    })
    .eq("id", userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Update couriers
  const { error: courierError } = await supabase
    .from("couriers")
    .update({
      courier_code: courierCode,
      vehicle_type: vehicleType,
      plate_number: plateNumber,
    })
    .eq("id", courierId);

  if (courierError) {
    return { success: false, error: courierError.message };
  }

  revalidatePath("/admin/couriers");
  revalidatePath("/admin/dashboard");

  return { success: true, message: "Data kurir berhasil diperbarui." };
}

/**
 * Server Action: Toggle courier active / inactive status (Soft deactivation)
 */
export async function toggleCourierStatusAction(
  courierId: string,
  userId: string,
  targetStatus: "ACTIVE" | "INACTIVE"
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const isTargetActive = targetStatus === "ACTIVE";

  // 1. Update couriers table
  const { error: courierErr } = await supabase
    .from("couriers")
    .update({ status: targetStatus })
    .eq("id", courierId);

  if (courierErr) {
    return { success: false, error: courierErr.message };
  }

  // 2. Update profiles table
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ is_active: isTargetActive })
    .eq("id", userId);

  if (profileErr) {
    return { success: false, error: profileErr.message };
  }

  revalidatePath("/admin/couriers");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Status kurir berhasil diubah menjadi ${targetStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`,
  };
}

/**
 * Server Action: Reset courier password securely via Supabase Admin Auth
 */
export async function resetCourierPasswordAction(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  await requireAdmin();

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: "Kata sandi baru minimal harus 6 karakter.",
    };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Kata sandi kurir berhasil diperbarui secara aman.",
    };
  } catch (err: unknown) {
    console.error("Exception resetting courier password:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat mereset kata sandi.",
    };
  }
}
