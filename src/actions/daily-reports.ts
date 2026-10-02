"use server";

import { revalidatePath } from "next/cache";
import { requireCourier, requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getWitaDateString, formatWitaDateTime } from "@/lib/date";
import {
  type DailyReportInput,
  type RegionSelection,
  validateDailyReportInput,
} from "@/lib/validations/report";
import { formatRouteDisplay, validateRouteSelection } from "@/lib/region/route";
import { getPackageTypes } from "@/actions/package-types";

export interface DailyReportRecord {
  id: string;
  courierId: string;
  courierName?: string;
  courierCode?: string;
  date: string;
  packageTypeId: string;
  packageTypeName: string;
  origin: RegionSelection;
  destination: RegionSelection;
  routeDisplay: string;
  orderCount: number;
  omset: number;
  ojolCount: number;
  ojolAmount: number;
  jastipCount: number;
  jastipAmount: number;
  notes: string | null;
  createdAt: string;
  createdAtFormatted: string;
  updatedAt: string;
  isEditableByCourier: boolean;
}

export interface DailyReportActionResult {
  success: boolean;
  error?: string;
  message?: string;
  reportId?: string;
  report?: DailyReportRecord;
}

// In-memory mock storage for local preview & offline development
interface MockReportEntry {
  id: string;
  courier_id: string;
  courier_name: string;
  courier_code: string;
  date: string;
  package_type_id: string;
  package_type_name: string;
  origin_province_id: string;
  origin_province_name: string;
  origin_regency_id: string;
  origin_regency_name: string;
  origin_district_id: string;
  origin_district_name: string;
  origin_village_id: string;
  origin_village_name: string;
  dest_province_id: string;
  dest_province_name: string;
  dest_regency_id: string;
  dest_regency_name: string;
  dest_district_id: string;
  dest_district_name: string;
  dest_village_id: string;
  dest_village_name: string;
  order_count: number;
  omset: number;
  ojol_count: number;
  ojol_amount: number;
  jastip_count: number;
  jastip_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

let localMockReports: MockReportEntry[] = [
  {
    id: "rep-seed-1",
    courier_id: "mock-courier-rec-id",
    courier_name: "Kurir Lapangan Ali",
    courier_code: "JF-001",
    date: getWitaDateString(),
    package_type_id: "pkg-reguler-id",
    package_type_name: "Reguler",
    origin_province_id: "76",
    origin_province_name: "SULAWESI BARAT",
    origin_regency_id: "7604",
    origin_regency_name: "KABUPATEN POLEWALI MANDAR",
    origin_district_id: "760401",
    origin_district_name: "POLEWALI",
    origin_village_id: "7604011001",
    origin_village_name: "MANDING",
    dest_province_id: "76",
    dest_province_name: "SULAWESI BARAT",
    dest_regency_id: "7604",
    dest_regency_name: "KABUPATEN POLEWALI MANDAR",
    dest_district_id: "760401",
    dest_district_name: "POLEWALI",
    dest_village_id: "7604011002",
    dest_village_name: "MADATTE",
    order_count: 14,
    omset: 140000,
    ojol_count: 3,
    ojol_amount: 30000,
    jastip_count: 2,
    jastip_amount: 25000,
    notes: "Pengiriman rute dalam kota Polewali lancar.",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "rep-seed-2",
    courier_id: "mock-courier-rec-id",
    courier_name: "Kurir Lapangan Ali",
    courier_code: "JF-001",
    date: getWitaDateString(),
    package_type_id: "pkg-express-id",
    package_type_name: "Express",
    origin_province_id: "76",
    origin_province_name: "SULAWESI BARAT",
    origin_regency_id: "7604",
    origin_regency_name: "KABUPATEN POLEWALI MANDAR",
    origin_district_id: "760401",
    origin_district_name: "POLEWALI",
    origin_village_id: "7604011001",
    origin_village_name: "MANDING",
    dest_province_id: "76",
    dest_province_name: "SULAWESI BARAT",
    dest_regency_id: "7604",
    dest_regency_name: "KABUPATEN POLEWALI MANDAR",
    dest_district_id: "760402",
    dest_district_name: "WONOMULYO",
    dest_village_id: "7604021001",
    dest_village_name: "SIDODADI",
    order_count: 8,
    omset: 96000,
    ojol_count: 1,
    ojol_amount: 15000,
    jastip_count: 0,
    jastip_amount: 0,
    notes: "Paket express ke pasar Wonomulyo.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

/**
 * Reset local mock reports for automated test repeatability
 */
export async function resetMockReportsForTesting() {
  localMockReports = [];
}

/**
 * Format entry into full DailyReportRecord
 */
function mapMockToRecord(
  entry: MockReportEntry,
  currentCourierId?: string
): DailyReportRecord {
  const todayWita = getWitaDateString();
  const isEditable =
    entry.courier_id === currentCourierId && entry.date === todayWita;

  const origin: RegionSelection = {
    provinceId: entry.origin_province_id,
    provinceName: entry.origin_province_name,
    regencyId: entry.origin_regency_id,
    regencyName: entry.origin_regency_name,
    districtId: entry.origin_district_id,
    districtName: entry.origin_district_name,
    villageId: entry.origin_village_id,
    villageName: entry.origin_village_name,
  };

  const destination: RegionSelection = {
    provinceId: entry.dest_province_id,
    provinceName: entry.dest_province_name,
    regencyId: entry.dest_regency_id,
    regencyName: entry.dest_regency_name,
    districtId: entry.dest_district_id,
    districtName: entry.dest_district_name,
    villageId: entry.dest_village_id,
    villageName: entry.dest_village_name,
  };

  return {
    id: entry.id,
    courierId: entry.courier_id,
    courierName: entry.courier_name,
    courierCode: entry.courier_code,
    date: entry.date,
    packageTypeId: entry.package_type_id,
    packageTypeName: entry.package_type_name,
    origin,
    destination,
    routeDisplay: formatRouteDisplay(origin, destination),
    orderCount: entry.order_count,
    omset: entry.omset,
    ojolCount: entry.ojol_count,
    ojolAmount: entry.ojol_amount,
    jastipCount: entry.jastip_count,
    jastipAmount: entry.jastip_amount,
    notes: entry.notes,
    createdAt: entry.created_at,
    createdAtFormatted: formatWitaDateTime(new Date(entry.created_at)),
    updatedAt: entry.updated_at,
    isEditableByCourier: isEditable,
  };
}

/**
 * Server Action: Submit Daily Operational Report
 * Enforces server-side authentication, validation, package type active check,
 * and anti-duplicate submission safeguards.
 */
export async function createDailyReportAction(
  rawInput: DailyReportInput
): Promise<DailyReportActionResult> {
  const session = await requireCourier();
  const courierId = session.courier?.id;

  if (!courierId) {
    return { success: false, error: "Identitas profil kurir tidak ditemukan." };
  }

  // Force authoritative courier ownership
  const input: DailyReportInput = {
    ...rawInput,
    courierId,
  };

  // 1. Validation schema
  const validation = validateDailyReportInput(input);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError || "Data laporan tidak valid." };
  }

  // 1b. Indonesian Regional Hierarchy & Route validation
  const routeValidation = validateRouteSelection(input.origin, input.destination);
  if (!routeValidation.isValid) {
    return {
      success: false,
      error: routeValidation.error || "Rute wilayah tidak valid.",
    };
  }

  // 2. Validate package type is active
  const activePackages = await getPackageTypes({ activeOnly: true });
  const matchedPackage = activePackages.find((p) => p.id === input.packageTypeId);
  if (!matchedPackage) {
    return {
      success: false,
      error: "Jenis paket yang dipilih tidak aktif atau tidak ditemukan.",
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // Local Mock Handling
  if (isPlaceholderEnv) {
    // Duplicate check: same courier, same date, same origin & dest village, same package, submitted recently
    const duplicate = localMockReports.find(
      (r) =>
        r.courier_id === courierId &&
        r.date === input.date &&
        r.origin_village_id === input.origin.villageId &&
        r.dest_village_id === input.destination.villageId &&
        r.package_type_id === input.packageTypeId &&
        r.order_count === input.orderCount &&
        r.omset === input.omset
    );

    if (duplicate) {
      return {
        success: false,
        error: "Laporan serupa untuk rute dan paket ini sudah pernah disimpan hari ini.",
      };
    }

    const newReport: MockReportEntry = {
      id: `rep-${Date.now()}`,
      courier_id: courierId,
      courier_name: session.profile?.fullName || "Kurir",
      courier_code: session.courier?.courierCode || "JF-KURIR",
      date: input.date,
      package_type_id: matchedPackage.id,
      package_type_name: matchedPackage.name,
      origin_province_id: input.origin.provinceId,
      origin_province_name: input.origin.provinceName,
      origin_regency_id: input.origin.regencyId,
      origin_regency_name: input.origin.regencyName,
      origin_district_id: input.origin.districtId,
      origin_district_name: input.origin.districtName,
      origin_village_id: input.origin.villageId,
      origin_village_name: input.origin.villageName,
      dest_province_id: input.destination.provinceId,
      dest_province_name: input.destination.provinceName,
      dest_regency_id: input.destination.regencyId,
      dest_regency_name: input.destination.regencyName,
      dest_district_id: input.destination.districtId,
      dest_district_name: input.destination.districtName,
      dest_village_id: input.destination.villageId,
      dest_village_name: input.destination.villageName,
      order_count: input.orderCount,
      omset: input.omset,
      ojol_count: input.ojolCount,
      ojol_amount: input.ojolAmount,
      jastip_count: input.jastipCount,
      jastip_amount: input.jastipAmount,
      notes: input.notes?.trim() || null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    localMockReports.unshift(newReport);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/history");
    revalidatePath("/courier/reports/new");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "Laporan operasional berhasil disimpan ke sistem.",
      reportId: newReport.id,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = await createClient();

  // Check duplicate
  const { data: duplicate } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("courier_id", courierId)
    .eq("date", input.date)
    .eq("origin_village_id", input.origin.villageId)
    .eq("dest_village_id", input.destination.villageId)
    .eq("package_type_id", input.packageTypeId)
    .eq("order_count", input.orderCount)
    .eq("omset", input.omset)
    .maybeSingle();

  if (duplicate) {
    return {
      success: false,
      error: "Laporan serupa untuk rute dan paket ini sudah pernah disimpan hari ini.",
    };
  }

  const { data: inserted, error } = await supabase
    .from("daily_reports")
    .insert({
      courier_id: courierId,
      date: input.date,
      package_type_id: input.packageTypeId,
      origin_province_id: input.origin.provinceId,
      origin_province_name: input.origin.provinceName,
      origin_regency_id: input.origin.regencyId,
      origin_regency_name: input.origin.regencyName,
      origin_district_id: input.origin.districtId,
      origin_district_name: input.origin.districtName,
      origin_village_id: input.origin.villageId,
      origin_village_name: input.origin.villageName,
      dest_province_id: input.destination.provinceId,
      dest_province_name: input.destination.provinceName,
      dest_regency_id: input.destination.regencyId,
      dest_regency_name: input.destination.regencyName,
      dest_district_id: input.destination.districtId,
      dest_district_name: input.destination.districtName,
      dest_village_id: input.destination.villageId,
      dest_village_name: input.destination.villageName,
      order_count: input.orderCount,
      omset: input.omset,
      ojol_count: input.ojolCount,
      ojol_amount: input.ojolAmount,
      jastip_count: input.jastipCount,
      jastip_amount: input.jastipAmount,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      success: false,
      error: `Gagal menyimpan laporan operasional: ${error?.message || "Unknown error"}`,
    };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/history");
  revalidatePath("/courier/reports/new");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reports");

  return {
    success: true,
    message: "Laporan operasional berhasil disimpan ke sistem.",
    reportId: inserted.id,
  };
}

/**
 * Server Action: Update Daily Operational Report
 * Enforces ownership rules:
 * - Couriers can ONLY update their own report, and ONLY on the current operational date (WITA).
 * - Admins have authority to update when required.
 */
export async function updateDailyReportAction(
  reportId: string,
  rawInput: DailyReportInput
): Promise<DailyReportActionResult> {
  const session = await requireAuth();
  const isAdmin = session.profile?.role === "ADMIN";
  const courierId = session.courier?.id;

  if (!isAdmin && !courierId) {
    return { success: false, error: "Akses tidak diizinkan." };
  }

  const todayWita = getWitaDateString();

  // Validate input
  const validation = validateDailyReportInput({
    ...rawInput,
    courierId: courierId || rawInput.courierId,
  });

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError || "Data laporan tidak valid." };
  }

  // Indonesian Regional Hierarchy & Route validation
  const routeValidation = validateRouteSelection(rawInput.origin, rawInput.destination);
  if (!routeValidation.isValid) {
    return {
      success: false,
      error: routeValidation.error || "Rute wilayah tidak valid.",
    };
  }

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const existing = localMockReports.find((r) => r.id === reportId);
    if (!existing) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }

    // Ownership check for courier
    if (!isAdmin) {
      if (existing.courier_id !== courierId) {
        return { success: false, error: "Anda tidak memiliki akses mengubah laporan kurir lain." };
      }
      if (existing.date !== todayWita) {
        return {
          success: false,
          error: "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir.",
        };
      }
    }

    // Update fields
    existing.package_type_id = rawInput.packageTypeId;
    existing.origin_province_id = rawInput.origin.provinceId;
    existing.origin_province_name = rawInput.origin.provinceName;
    existing.origin_regency_id = rawInput.origin.regencyId;
    existing.origin_regency_name = rawInput.origin.regencyName;
    existing.origin_district_id = rawInput.origin.districtId;
    existing.origin_district_name = rawInput.origin.districtName;
    existing.origin_village_id = rawInput.origin.villageId;
    existing.origin_village_name = rawInput.origin.villageName;
    existing.dest_province_id = rawInput.destination.provinceId;
    existing.dest_province_name = rawInput.destination.provinceName;
    existing.dest_regency_id = rawInput.destination.regencyId;
    existing.dest_regency_name = rawInput.destination.regencyName;
    existing.dest_district_id = rawInput.destination.districtId;
    existing.dest_district_name = rawInput.destination.districtName;
    existing.dest_village_id = rawInput.destination.villageId;
    existing.dest_village_name = rawInput.destination.villageName;
    existing.order_count = rawInput.orderCount;
    existing.omset = rawInput.omset;
    existing.ojol_count = rawInput.ojolCount;
    existing.ojol_amount = rawInput.ojolAmount;
    existing.jastip_count = rawInput.jastipCount;
    existing.jastip_amount = rawInput.jastipAmount;
    existing.notes = rawInput.notes?.trim() || null;
    existing.updated_at = new Date().toISOString();

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/history");
    revalidatePath(`/courier/reports/${reportId}/edit`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "Laporan operasional berhasil diperbarui.",
      reportId: existing.id,
    };
  }

  const supabase = await createClient();

  // Fetch report for ownership verification
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_reports")
    .select("id, courier_id, date")
    .eq("id", reportId)
    .single();

  if (fetchErr || !existing) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  if (!isAdmin) {
    if (existing.courier_id !== courierId) {
      return { success: false, error: "Anda tidak memiliki akses mengubah laporan kurir lain." };
    }
    if (existing.date !== todayWita) {
      return {
        success: false,
        error: "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir.",
      };
    }
  }

  const { error: updateErr } = await supabase
    .from("daily_reports")
    .update({
      package_type_id: rawInput.packageTypeId,
      origin_province_id: rawInput.origin.provinceId,
      origin_province_name: rawInput.origin.provinceName,
      origin_regency_id: rawInput.origin.regencyId,
      origin_regency_name: rawInput.origin.regencyName,
      origin_district_id: rawInput.origin.districtId,
      origin_district_name: rawInput.origin.districtName,
      origin_village_id: rawInput.origin.villageId,
      origin_village_name: rawInput.origin.villageName,
      dest_province_id: rawInput.destination.provinceId,
      dest_province_name: rawInput.destination.provinceName,
      dest_regency_id: rawInput.destination.regencyId,
      dest_regency_name: rawInput.destination.regencyName,
      dest_district_id: rawInput.destination.districtId,
      dest_district_name: rawInput.destination.districtName,
      dest_village_id: rawInput.destination.villageId,
      dest_village_name: rawInput.destination.villageName,
      order_count: rawInput.orderCount,
      omset: rawInput.omset,
      ojol_count: rawInput.ojolCount,
      ojol_amount: rawInput.ojolAmount,
      jastip_count: rawInput.jastipCount,
      jastip_amount: rawInput.jastipAmount,
      notes: rawInput.notes?.trim() || null,
    })
    .eq("id", reportId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/history");
  revalidatePath(`/courier/reports/${reportId}/edit`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reports");

  return {
    success: true,
    message: "Laporan operasional berhasil diperbarui.",
    reportId: existing.id,
  };
}

/**
 * Fetch personal daily reports for the logged-in courier
 */
export async function getCourierDailyReports(options?: {
  date?: string;
}): Promise<DailyReportRecord[]> {
  const session = await requireCourier();
  const courierId = session.courier?.id;

  if (!courierId) return [];

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    let filtered = localMockReports.filter((r) => r.courier_id === courierId);
    if (options?.date) {
      filtered = filtered.filter((r) => r.date === options.date);
    }
    return filtered.map((e) => mapMockToRecord(e, courierId));
  }

  const supabase = await createClient();

  let query = supabase
    .from("daily_reports")
    .select(`
      *,
      package_types:package_type_id ( name )
    `)
    .eq("courier_id", courierId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.date) {
    query = query.eq("date", options.date);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching courier daily reports:", error);
    return [];
  }

  const todayWita = getWitaDateString();

  return data.map((item) => {
    const pkg = Array.isArray(item.package_types)
      ? item.package_types[0]
      : item.package_types;
    const origin: RegionSelection = {
      provinceId: item.origin_province_id,
      provinceName: item.origin_province_name,
      regencyId: item.origin_regency_id,
      regencyName: item.origin_regency_name,
      districtId: item.origin_district_id,
      districtName: item.origin_district_name,
      villageId: item.origin_village_id,
      villageName: item.origin_village_name,
    };
    const destination: RegionSelection = {
      provinceId: item.dest_province_id,
      provinceName: item.dest_province_name,
      regencyId: item.dest_regency_id,
      regencyName: item.dest_regency_name,
      districtId: item.dest_district_id,
      districtName: item.dest_district_name,
      villageId: item.dest_village_id,
      villageName: item.dest_village_name,
    };

    return {
      id: item.id,
      courierId: item.courier_id,
      courierName: session.profile?.fullName,
      courierCode: session.courier?.courierCode,
      date: item.date,
      packageTypeId: item.package_type_id,
      packageTypeName: pkg?.name || "Reguler",
      origin,
      destination,
      routeDisplay: formatRouteDisplay(origin, destination),
      orderCount: item.order_count,
      omset: Number(item.omset) || 0,
      ojolCount: item.ojol_count,
      ojolAmount: Number(item.ojol_amount) || 0,
      jastipCount: item.jastip_count,
      jastipAmount: Number(item.jastip_amount) || 0,
      notes: item.notes,
      createdAt: item.created_at,
      createdAtFormatted: formatWitaDateTime(new Date(item.created_at)),
      updatedAt: item.updated_at,
      isEditableByCourier: item.date === todayWita,
    };
  });
}

/**
 * Fetch a single report by ID with ownership enforcement
 */
export async function getDailyReportById(
  reportId: string
): Promise<DailyReportRecord | null> {
  const session = await requireAuth();
  const isAdmin = session.profile?.role === "ADMIN";
  const courierId = session.courier?.id;

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const found = localMockReports.find((r) => r.id === reportId);
    if (!found) return null;

    if (!isAdmin && found.courier_id !== courierId) {
      return null;
    }

    return mapMockToRecord(found, courierId);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .select(`
      *,
      package_types:package_type_id ( name ),
      couriers:courier_id (
        courier_code,
        profiles:user_id ( full_name )
      )
    `)
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return null;
  }

  if (!isAdmin && data.courier_id !== courierId) {
    return null;
  }

  const todayWita = getWitaDateString();
  const pkg = Array.isArray(data.package_types)
    ? data.package_types[0]
    : data.package_types;

  const courierObj = Array.isArray(data.couriers)
    ? data.couriers[0]
    : data.couriers;
  const profileObj = courierObj?.profiles
    ? Array.isArray(courierObj.profiles)
      ? courierObj.profiles[0]
      : courierObj.profiles
    : null;

  const origin: RegionSelection = {
    provinceId: data.origin_province_id,
    provinceName: data.origin_province_name,
    regencyId: data.origin_regency_id,
    regencyName: data.origin_regency_name,
    districtId: data.origin_district_id,
    districtName: data.origin_district_name,
    villageId: data.origin_village_id,
    villageName: data.origin_village_name,
  };
  const destination: RegionSelection = {
    provinceId: data.dest_province_id,
    provinceName: data.dest_province_name,
    regencyId: data.dest_regency_id,
    regencyName: data.dest_regency_name,
    districtId: data.dest_district_id,
    districtName: data.dest_district_name,
    villageId: data.dest_village_id,
    villageName: data.dest_village_name,
  };

  return {
    id: data.id,
    courierId: data.courier_id,
    courierName: profileObj?.full_name || "Kurir",
    courierCode: courierObj?.courier_code || "JF-KURIR",
    date: data.date,
    packageTypeId: data.package_type_id,
    packageTypeName: pkg?.name || "Reguler",
    origin,
    destination,
    routeDisplay: formatRouteDisplay(origin, destination),
    orderCount: data.order_count,
    omset: Number(data.omset) || 0,
    ojolCount: data.ojol_count,
    ojolAmount: Number(data.ojol_amount) || 0,
    jastipCount: data.jastip_count,
    jastipAmount: Number(data.jastip_amount) || 0,
    notes: data.notes,
    createdAt: data.created_at,
    createdAtFormatted: formatWitaDateTime(new Date(data.created_at)),
    updatedAt: data.updated_at,
    isEditableByCourier: data.date === todayWita,
  };
}
