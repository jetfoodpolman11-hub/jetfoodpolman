"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
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
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const AVATAR_BUCKET = "courier-avatars";

// Empty initial store (all dummy/demo courier accounts removed)
const MOCK_COURIERS: CourierWithProfile[] = [];

/**
 * Helper: Upload courier profile photo (File or compressed Data URL) to Supabase Storage public bucket
 */
async function uploadCourierAvatarToSupabase(
  userId: string,
  formData: FormData
): Promise<string | null> {
  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const avatarDataUrl = (formData.get("avatarDataUrl") as string | null)?.trim();
  const avatarFile = formData.get("avatarFile") as File | null;

  if (isPlaceholderEnv) {
    return avatarDataUrl || null;
  }

  let fileBuffer: Buffer | null = null;
  let contentType = "image/jpeg";
  let ext = "jpg";

  if (avatarDataUrl && avatarDataUrl.startsWith("data:image/")) {
    const match = avatarDataUrl.match(/^data:(image\/([a-zA-Z0-9+.-]+));base64,(.+)$/);
    if (match) {
      contentType = match[1];
      const subType = match[2].toLowerCase();
      ext = subType === "png" ? "png" : subType === "webp" ? "webp" : "jpg";
      fileBuffer = Buffer.from(match[3], "base64");
    }
  } else if (avatarFile && typeof avatarFile === "object" && avatarFile.size > 0) {
    const arrayBuffer = await avatarFile.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
    contentType = avatarFile.type || "image/jpeg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else ext = "jpg";
  }

  if (!fileBuffer) {
    return null;
  }

  try {
    const adminClient = createAdminClient();

    // Ensure public bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === AVATAR_BUCKET);
    if (!exists) {
      await adminClient.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: 8 * 1024 * 1024,
      });
    }

    const filePath = `avatars/${userId}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await adminClient.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("Failed to upload courier avatar to Supabase Storage:", uploadErr.message);
      return avatarDataUrl || null;
    }

    const { data: publicUrlData } = adminClient.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error("Error uploading courier avatar:", err);
    return avatarDataUrl || null;
  }
}

/**
 * Internal helper: Resolve all couriers from Supabase (Fast single PostgreSQL join query)
 */
export async function fetchAllCouriersInternal(): Promise<CourierWithProfile[]> {
  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    return [...MOCK_COURIERS];
  }

  try {
    const adminClient = createAdminClient();

    // 1. Fast single PostgreSQL query on couriers + profiles (includes avatar_url)
    const { data, error } = await adminClient
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
          avatar_url,
          is_active
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted: CourierWithProfile[] = [];
      for (const item of data) {
        const profile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : item.profiles;
        if (profile) {
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
            avatarUrl: profile.avatar_url || null,
            isActive: profile.is_active,
            createdAt: item.created_at,
          });
        }
      }
      return formatted;
    }

    // 2. Fallback to Supabase Auth metadata ONLY if PostgreSQL tables are not yet initialized
    const { data: usersList } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!usersList?.users) {
      return [];
    }

    const authCouriers: CourierWithProfile[] = [];
    for (const u of usersList.users) {
      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      if (meta.role === "KURIR" && typeof meta.courier_code === "string") {
        const status: "ACTIVE" | "INACTIVE" =
          meta.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
        const isActive = meta.is_active !== false && status === "ACTIVE";
        const avatarUrl =
          typeof meta.avatar_url === "string" && meta.avatar_url
            ? meta.avatar_url
            : null;
        authCouriers.push({
          id: (typeof meta.courier_id === "string" && meta.courier_id) || u.id,
          userId: u.id,
          courierCode: meta.courier_code.toUpperCase(),
          vehicleType:
            typeof meta.vehicle_type === "string"
              ? meta.vehicle_type
              : "Sepeda Motor",
          plateNumber:
            typeof meta.plate_number === "string" ? meta.plate_number : null,
          status,
          fullName:
            (typeof meta.full_name === "string" && meta.full_name) ||
            u.email ||
            "Kurir",
          email: u.email || "",
          phone: typeof meta.phone === "string" ? meta.phone : null,
          avatarUrl,
          isActive,
          createdAt: u.created_at || new Date().toISOString(),
        });
      }
    }

    authCouriers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return authCouriers;
  } catch (err) {
    console.error("Error fetching couriers from Supabase:", err);
    return [];
  }
}

/**
 * Internal helper: Find a single courier by courierCode across Supabase
 * Supports both exact match (e.g. JF0001) and normalized match ignoring hyphens/spaces (e.g. JF-0001 <-> JF0001)
 */
export async function findCourierByCodeInternal(
  courierCode: string
): Promise<CourierWithProfile | null> {
  const cleanCode = courierCode.trim().toUpperCase();
  const normalizedInput = cleanCode.replace(/[-\s]/g, "");
  const all = await fetchAllCouriersInternal();
  return (
    all.find(
      (c) =>
        c.courierCode.toUpperCase() === cleanCode ||
        c.courierCode.toUpperCase().replace(/[-\s]/g, "") === normalizedInput
    ) || null
  );
}

/**
 * Fetch all couriers with their associated profiles (Admin only)
 */
export async function getCouriers(options?: {
  search?: string;
  status?: string;
}): Promise<CourierWithProfile[]> {
  await requireAdmin();

  let list = await fetchAllCouriersInternal();

  if (
    options?.status &&
    (options.status === "ACTIVE" || options.status === "INACTIVE")
  ) {
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
  const courierCode = (formData.get("courierCode") as string)
    ?.trim()
    .toUpperCase();
  const vehicleType = (formData.get("vehicleType") as string)?.trim() || null;
  const plateNumber =
    (formData.get("plateNumber") as string)?.trim().toUpperCase() || null;
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

  // 2. Check duplicates against existing couriers
  const existingCouriers = await fetchAllCouriersInternal();
  const dupEmail = existingCouriers.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  if (dupEmail) {
    return {
      success: false,
      error: `Email ${email} sudah terdaftar di sistem.`,
    };
  }

  const normalizedNewCode = courierCode.replace(/[-\s]/g, "");
  const dupCode = existingCouriers.find(
    (c) =>
      c.courierCode.toUpperCase() === courierCode.toUpperCase() ||
      c.courierCode.toUpperCase().replace(/[-\s]/g, "") === normalizedNewCode
  );
  if (dupCode) {
    return {
      success: false,
      error: `Kode kurir ${courierCode} sudah digunakan. Gunakan kode lain.`,
    };
  }

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const tempUserId = `courier-user-${Date.now()}`;
    const avatarUrl = await uploadCourierAvatarToSupabase(tempUserId, formData);

    const newCourier: CourierWithProfile = {
      id: `courier-rec-${Date.now()}`,
      userId: tempUserId,
      courierCode,
      vehicleType: vehicleType || "Sepeda Motor",
      plateNumber,
      status: "ACTIVE",
      fullName,
      email,
      phone,
      avatarUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    MOCK_COURIERS.unshift(newCourier);
    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: `Kurir ${fullName} (${courierCode}) berhasil didaftarkan.`,
    };
  }

  try {
    const adminClient = createAdminClient();

    // 3. Create user in Supabase Auth via Admin API with complete courier metadata
    const { data: authUser, error: authCreateError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "KURIR",
          full_name: fullName,
          phone,
          courier_code: courierCode,
          vehicle_type: vehicleType || "Sepeda Motor",
          plate_number: plateNumber,
          status: "ACTIVE",
          is_active: true,
        },
      });

    if (authCreateError || !authUser.user) {
      return {
        success: false,
        error:
          authCreateError?.message || "Gagal membuat akun autentikasi kurir.",
      };
    }

    const newUserId = authUser.user.id;

    // 4. Upload profile photo to Supabase Storage if provided
    const avatarUrl = await uploadCourierAvatarToSupabase(newUserId, formData);

    // 5. Also insert into PostgreSQL profiles & couriers tables if schema is initialized
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId,
      role: "KURIR",
      full_name: fullName,
      email,
      phone,
      avatar_url: avatarUrl,
      is_active: true,
    });

    let resolvedCourierId = newUserId;
    if (!profileError) {
      const { data: insertedCourier } = await adminClient
        .from("couriers")
        .insert({
          user_id: newUserId,
          courier_code: courierCode,
          vehicle_type: vehicleType || "Sepeda Motor",
          plate_number: plateNumber,
          status: "ACTIVE",
        })
        .select("id")
        .maybeSingle();

      if (insertedCourier?.id) {
        resolvedCourierId = insertedCourier.id;
      }
    }

    // 6. Save final metadata (including avatar_url and courier_id) in Supabase Auth
    await adminClient.auth.admin.updateUserById(newUserId, {
      user_metadata: {
        role: "KURIR",
        courier_id: resolvedCourierId,
        full_name: fullName,
        phone,
        courier_code: courierCode,
        vehicle_type: vehicleType || "Sepeda Motor",
        plate_number: plateNumber,
        avatar_url: avatarUrl,
        status: "ACTIVE",
        is_active: true,
      },
    });

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: `Kurir ${fullName} (${courierCode}) berhasil didaftarkan ke Supabase.`,
    };
  } catch (err: unknown) {
    console.error("Exception during courier creation:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat membuat kurir.",
    };
  }
}

/**
 * Server Action: Update courier details (including optional new profile photo)
 */
export async function updateCourierAction(
  courierId: string,
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const courierCode = (formData.get("courierCode") as string)
    ?.trim()
    .toUpperCase();
  const vehicleType = (formData.get("vehicleType") as string)?.trim() || null;
  const plateNumber =
    (formData.get("plateNumber") as string)?.trim().toUpperCase() || null;

  if (!fullName) {
    return { success: false, error: "Nama lengkap wajib diisi" };
  }
  if (!courierCode) {
    return { success: false, error: "Kode kurir wajib diisi" };
  }

  const allCouriers = await fetchAllCouriersInternal();
  const conflict = allCouriers.find(
    (c) =>
      c.id !== courierId &&
      c.userId !== userId &&
      c.courierCode.toUpperCase() === courierCode
  );
  if (conflict) {
    return {
      success: false,
      error: `Kode kurir ${courierCode} sudah digunakan oleh kurir lain.`,
    };
  }

  const uploadedAvatarUrl = await uploadCourierAvatarToSupabase(
    userId,
    formData
  );

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const target = MOCK_COURIERS.find((c) => c.id === courierId);
    if (!target) {
      return { success: false, error: "Data kurir tidak ditemukan." };
    }

    target.fullName = fullName;
    target.phone = phone;
    target.courierCode = courierCode;
    target.vehicleType = vehicleType;
    target.plateNumber = plateNumber;
    if (uploadedAvatarUrl) {
      target.avatarUrl = uploadedAvatarUrl;
    }

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/account");

    return { success: true, message: "Data kurir berhasil diperbarui." };
  }

  const adminClient = createAdminClient();
  const existingTarget = allCouriers.find(
    (c) => c.id === courierId || c.userId === userId
  );

  const finalAvatarUrl =
    uploadedAvatarUrl !== null
      ? uploadedAvatarUrl
      : existingTarget?.avatarUrl || null;

  // 1. Update PostgreSQL tables and Auth metadata in parallel
  await Promise.all([
    adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: "KURIR",
        courier_id: courierId,
        full_name: fullName,
        phone,
        courier_code: courierCode,
        vehicle_type: vehicleType || "Sepeda Motor",
        plate_number: plateNumber,
        avatar_url: finalAvatarUrl,
        status: existingTarget?.status || "ACTIVE",
        is_active: existingTarget?.isActive ?? true,
      },
    }),
    adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        avatar_url: finalAvatarUrl,
      })
      .eq("id", userId),
    adminClient
      .from("couriers")
      .update({
        courier_code: courierCode,
        vehicle_type: vehicleType,
        plate_number: plateNumber,
      })
      .eq("id", courierId),
  ]);

  revalidatePath("/admin/couriers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");
  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/account");

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

  const isTargetActive = targetStatus === "ACTIVE";

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const target = MOCK_COURIERS.find((c) => c.id === courierId);
    if (!target) {
      return { success: false, error: "Data kurir tidak ditemukan." };
    }
    target.status = targetStatus;
    target.isActive = isTargetActive;

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: `Status kurir berhasil diubah menjadi ${targetStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`,
    };
  }

  const adminClient = createAdminClient();
  const allCouriers = await fetchAllCouriersInternal();
  const existingTarget = allCouriers.find(
    (c) => c.id === courierId || c.userId === userId
  );

  // 1. Update Supabase Auth metadata
  if (existingTarget) {
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: "KURIR",
        courier_id: existingTarget.id,
        full_name: existingTarget.fullName,
        phone: existingTarget.phone,
        courier_code: existingTarget.courierCode,
        vehicle_type: existingTarget.vehicleType,
        plate_number: existingTarget.plateNumber,
        avatar_url: existingTarget.avatarUrl,
        status: targetStatus,
        is_active: isTargetActive,
      },
    });
  }

  // 2. Update PostgreSQL tables if present
  await adminClient
    .from("couriers")
    .update({ status: targetStatus })
    .eq("id", courierId);

  await adminClient
    .from("profiles")
    .update({ is_active: isTargetActive })
    .eq("id", userId);

  revalidatePath("/admin/couriers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");

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

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const target = MOCK_COURIERS.find((c) => c.userId === userId);
    if (!target) {
      return { success: false, error: "Akun kurir tidak ditemukan." };
    }
    return {
      success: true,
      message: "Kata sandi kurir berhasil diperbarui secara aman.",
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
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mereset kata sandi.",
    };
  }
}

/**
 * Server Action: Permanently delete a courier account and all associated records from Supabase (Admin only)
 */
export async function deleteCourierAction(
  courierId: string,
  userId: string
): Promise<ActionResult> {
  await requireAdmin();

  if (!courierId || !userId) {
    return { success: false, error: "ID kurir tidak valid." };
  }

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const idx = MOCK_COURIERS.findIndex(
      (c) => c.id === courierId || c.userId === userId
    );
    if (idx === -1) {
      return { success: false, error: "Data kurir tidak ditemukan." };
    }
    MOCK_COURIERS.splice(idx, 1);

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "Akun kurir berhasil dihapus permanen.",
    };
  }

  try {
    const adminClient = createAdminClient();

    // 1. Delete associated operational records first to satisfy foreign key constraints
    await Promise.all([
      adminClient.from("daily_reports").delete().eq("courier_id", courierId),
      adminClient.from("attendance").delete().eq("courier_id", courierId),
    ]);

    // 2. Delete courier record from public.couriers
    await adminClient.from("couriers").delete().eq("id", courierId);
    await adminClient.from("couriers").delete().eq("user_id", userId);

    // 3. Delete profile record from public.profiles
    await adminClient.from("profiles").delete().eq("id", userId);

    // 4. Delete user account from Supabase Auth (auth.users)
    const { error: authDelErr } =
      await adminClient.auth.admin.deleteUser(userId);
    if (authDelErr && !authDelErr.message.toLowerCase().includes("not found")) {
      console.error("Warning deleting auth user:", authDelErr.message);
    }

    revalidatePath("/admin/couriers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "Akun kurir beserta datanya berhasil dihapus permanen dari Supabase.",
    };
  } catch (err: unknown) {
    console.error("Exception deleting courier:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menghapus akun kurir dari database.",
    };
  }
}

