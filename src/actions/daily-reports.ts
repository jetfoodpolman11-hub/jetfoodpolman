"use server";

import { revalidatePath } from "next/cache";
import { requireCourier, requireAdmin, requireAuth } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCloudJson, writeCloudJson } from "@/lib/supabase/cloud-json-store";
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

// Empty initial store (all dummy/demo report history removed)
let localMockReports: MockReportEntry[] = [];
const REPORTS_CLOUD_FILE = "daily_reports.json";

/**
 * Reset local mock reports for automated test repeatability (Disabled in production)
 */
export async function resetMockReportsForTesting() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Operation forbidden in production environment.");
  }
  localMockReports = [];
}

/**
 * Strip PostgREST filter control characters to prevent .or() filter injection
 */
function sanitizePostgrestFilterInput(raw?: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const cleaned = raw
    .replace(/[,().%\\*;:'"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64)
    .toLowerCase();
  return cleaned.length > 0 ? cleaned : undefined;
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
  const routeValidation = validateRouteSelection(
    input.origin,
    input.destination
  );
  if (!routeValidation.isValid) {
    return {
      success: false,
      error: routeValidation.error || "Rute wilayah tidak valid.",
    };
  }

  // 2. Validate package type is active
  const activePackages = await getPackageTypes({ activeOnly: true });
  const matchedPackage = activePackages.find(
    (p) => p.id === input.packageTypeId
  );
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

  const buildReportEntry = (): MockReportEntry => ({
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  });

  // Local Mock Handling
  if (isPlaceholderEnv) {
    const newReport = buildReportEntry();
    localMockReports.unshift(newReport);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/history");
    revalidatePath("/courier/reports/new");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: "Laporan operasional berhasil disimpan ke sistem.",
      reportId: newReport.id,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = createAdminClient();

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

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );

    const newReport = buildReportEntry();
    cloudList.unshift(newReport);
    await writeCloudJson(REPORTS_CLOUD_FILE, cloudList);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/history");
    revalidatePath("/courier/reports/new");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: "Laporan operasional berhasil disimpan ke Supabase.",
      reportId: newReport.id,
    };
  }

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
  revalidatePath("/admin/analytics");

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
  const routeValidation = validateRouteSelection(
    rawInput.origin,
    rawInput.destination
  );
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
        return {
          success: false,
          error: "Anda tidak memiliki akses mengubah laporan kurir lain.",
        };
      }
      if (existing.date !== todayWita) {
        return {
          success: false,
          error:
            "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir.",
        };
      }
    }

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

  const supabase = createAdminClient();

  // Fetch report for ownership verification
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_reports")
    .select("id, courier_id, date")
    .eq("id", reportId)
    .single();

  if (fetchErr && fetchErr.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );
    const cloudExisting = cloudList.find((r) => r.id === reportId);
    if (!cloudExisting) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }
    if (!isAdmin) {
      if (cloudExisting.courier_id !== courierId) {
        return {
          success: false,
          error: "Anda tidak memiliki akses mengubah laporan kurir lain.",
        };
      }
      if (cloudExisting.date !== todayWita) {
        return {
          success: false,
          error:
            "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir.",
        };
      }
    }

    cloudExisting.package_type_id = rawInput.packageTypeId;
    cloudExisting.origin_province_id = rawInput.origin.provinceId;
    cloudExisting.origin_province_name = rawInput.origin.provinceName;
    cloudExisting.origin_regency_id = rawInput.origin.regencyId;
    cloudExisting.origin_regency_name = rawInput.origin.regencyName;
    cloudExisting.origin_district_id = rawInput.origin.districtId;
    cloudExisting.origin_district_name = rawInput.origin.districtName;
    cloudExisting.origin_village_id = rawInput.origin.villageId;
    cloudExisting.origin_village_name = rawInput.origin.villageName;
    cloudExisting.dest_province_id = rawInput.destination.provinceId;
    cloudExisting.dest_province_name = rawInput.destination.provinceName;
    cloudExisting.dest_regency_id = rawInput.destination.regencyId;
    cloudExisting.dest_regency_name = rawInput.destination.regencyName;
    cloudExisting.dest_district_id = rawInput.destination.districtId;
    cloudExisting.dest_district_name = rawInput.destination.districtName;
    cloudExisting.dest_village_id = rawInput.destination.villageId;
    cloudExisting.dest_village_name = rawInput.destination.villageName;
    cloudExisting.order_count = rawInput.orderCount;
    cloudExisting.omset = rawInput.omset;
    cloudExisting.ojol_count = rawInput.ojolCount;
    cloudExisting.ojol_amount = rawInput.ojolAmount;
    cloudExisting.jastip_count = rawInput.jastipCount;
    cloudExisting.jastip_amount = rawInput.jastipAmount;
    cloudExisting.notes = rawInput.notes?.trim() || null;
    cloudExisting.updated_at = new Date().toISOString();

    await writeCloudJson(REPORTS_CLOUD_FILE, cloudList);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/history");
    revalidatePath(`/courier/reports/${reportId}/edit`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "Laporan operasional berhasil diperbarui.",
      reportId: cloudExisting.id,
    };
  }

  if (fetchErr || !existing) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  if (!isAdmin) {
    if (existing.courier_id !== courierId) {
      return {
        success: false,
        error: "Anda tidak memiliki akses mengubah laporan kurir lain.",
      };
    }
    if (existing.date !== todayWita) {
      return {
        success: false,
        error:
          "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir.",
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

  const supabase = createAdminClient();

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

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );
    let filtered = cloudList.filter((r) => r.courier_id === courierId);
    if (options?.date) {
      filtered = filtered.filter((r) => r.date === options.date);
    }
    return filtered.map((e) => mapMockToRecord(e, courierId));
  }

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

  const supabase = createAdminClient();

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

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );
    const found = cloudList.find((r) => r.id === reportId);
    if (!found) return null;
    if (!isAdmin && found.courier_id !== courierId) {
      return null;
    }
    return mapMockToRecord(found, courierId);
  }

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

export interface AdminReportFilterOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  courierId?: string;
  packageTypeId?: string;
  routeQuery?: string;
  page?: number;
  perPage?: number;
}

export type ReportFeatureKey =
  | "paket"
  | "jastip"
  | "ojol"
  | "langsung"
  | "random";

export interface ReportFeatureSummaryItem {
  reportCount: number;
  orders: number;
  omset: number;
}

export interface AdminReportSummary {
  totalReports: number;
  totalOrders: number;
  totalOmset: number;
  totalOjolCount: number;
  totalOjolAmount: number;
  totalJastipCount: number;
  totalJastipAmount: number;
  byFeature: Record<ReportFeatureKey, ReportFeatureSummaryItem>;
}

export interface PaginatedAdminDailyReports {
  reports: DailyReportRecord[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  summary: AdminReportSummary;
}

function resolveReportFeatureKey(packageTypeName?: string): ReportFeatureKey {
  const lower = (packageTypeName || "").toLowerCase().trim();
  if (lower.includes("jastip")) return "jastip";
  if (lower.includes("langsung")) return "langsung";
  if (lower.includes("ojol")) return "ojol";
  if (lower.includes("random")) return "random";
  return "paket";
}

function createEmptyReportSummary(totalReports = 0): AdminReportSummary {
  return {
    totalReports,
    totalOrders: 0,
    totalOmset: 0,
    totalOjolCount: 0,
    totalOjolAmount: 0,
    totalJastipCount: 0,
    totalJastipAmount: 0,
    byFeature: {
      paket: { reportCount: 0, orders: 0, omset: 0 },
      jastip: { reportCount: 0, orders: 0, omset: 0 },
      ojol: { reportCount: 0, orders: 0, omset: 0 },
      langsung: { reportCount: 0, orders: 0, omset: 0 },
      random: { reportCount: 0, orders: 0, omset: 0 },
    },
  };
}

function buildAdminReportSummary(
  records: DailyReportRecord[],
  totalCount: number
): AdminReportSummary {
  const summary = createEmptyReportSummary(totalCount);

  for (const r of records) {
    const fKey = resolveReportFeatureKey(r.packageTypeName);
    const effectiveOrders =
      (r.orderCount || 0) + (r.ojolCount || 0) + (r.jastipCount || 0);
    const effectiveOmset =
      (r.omset || 0) + (r.ojolAmount || 0) + (r.jastipAmount || 0);

    summary.totalOrders += effectiveOrders;
    summary.totalOmset += effectiveOmset;
    summary.totalOjolCount += r.ojolCount || 0;
    summary.totalOjolAmount += r.ojolAmount || 0;
    summary.totalJastipCount += r.jastipCount || 0;
    summary.totalJastipAmount += r.jastipAmount || 0;

    summary.byFeature[fKey].reportCount += 1;
    summary.byFeature[fKey].orders += effectiveOrders;
    summary.byFeature[fKey].omset += effectiveOmset;
  }

  return summary;
}

/**
 * Fetch all daily reports for Admin monitoring with server-side filters,
 * summary aggregation, and pagination.
 */
export async function getAdminDailyReports(
  options?: AdminReportFilterOptions
): Promise<PaginatedAdminDailyReports> {
  await requireAdmin();

  const page = Math.max(1, options?.page || 1);
  const perPage = Math.max(1, Math.min(5000, options?.perPage || 10));
  const date =
    options?.date && options.date !== "ALL" ? options.date : undefined;
  const startDate =
    options?.startDate && options.startDate !== "ALL"
      ? options.startDate
      : undefined;
  const endDate =
    options?.endDate && options.endDate !== "ALL" ? options.endDate : undefined;
  const courierId =
    options?.courierId && options.courierId !== "ALL"
      ? options.courierId
      : undefined;
  const packageTypeId =
    options?.packageTypeId && options.packageTypeId !== "ALL"
      ? options.packageTypeId
      : undefined;
  const routeQuery = sanitizePostgrestFilterInput(options?.routeQuery);

  const filterMemoryList = (source: MockReportEntry[]) => {
    let filtered = [...source];
    if (date) {
      filtered = filtered.filter((r) => r.date === date);
    }
    if (startDate) {
      filtered = filtered.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((r) => r.date <= endDate);
    }
    if (courierId) {
      filtered = filtered.filter((r) => r.courier_id === courierId);
    }
    if (packageTypeId) {
      filtered = filtered.filter((r) => r.package_type_id === packageTypeId);
    }
    if (routeQuery) {
      filtered = filtered.filter((r) => {
        const originDesc =
          `${r.origin_village_name} ${r.origin_district_name} ${r.origin_regency_name}`.toLowerCase();
        const destDesc =
          `${r.dest_village_name} ${r.dest_district_name} ${r.dest_regency_name}`.toLowerCase();
        return originDesc.includes(routeQuery) || destDesc.includes(routeQuery);
      });
    }

    const allMapped = filtered.map((e) => mapMockToRecord(e));
    const total = allMapped.length;
    const summary = buildAdminReportSummary(allMapped, total);
    const totalPages = Math.ceil(total / perPage) || 1;
    const offset = (page - 1) * perPage;
    const reports = allMapped.slice(offset, offset + perPage);

    return {
      reports,
      total,
      page,
      perPage,
      totalPages,
      summary,
    };
  };

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    return filterMemoryList(localMockReports);
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("daily_reports")
    .select(
      `
      *,
      package_types:package_type_id ( name ),
      couriers:courier_id (
        courier_code,
        profiles:user_id ( full_name )
      )
    `,
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  }
  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }
  if (courierId) {
    query = query.eq("courier_id", courierId);
  }
  if (packageTypeId) {
    query = query.eq("package_type_id", packageTypeId);
  }
  if (routeQuery) {
    query = query.or(
      `origin_village_name.ilike.%${routeQuery}%,origin_district_name.ilike.%${routeQuery}%,origin_regency_name.ilike.%${routeQuery}%,dest_village_name.ilike.%${routeQuery}%,dest_district_name.ilike.%${routeQuery}%,dest_regency_name.ilike.%${routeQuery}%`
    );
  }

  query = query.range(0, 4999);

  const { data, count, error } = await query;

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );
    return filterMemoryList(cloudList);
  }

  if (error || !data) {
    console.error("Error fetching admin daily reports:", error);
    return {
      reports: [],
      total: 0,
      page,
      perPage,
      totalPages: 1,
      summary: createEmptyReportSummary(0),
    };
  }

  const total = count ?? data.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const allReports: DailyReportRecord[] = data.map((item) => {
    const pkg = Array.isArray(item.package_types)
      ? item.package_types[0]
      : item.package_types;

    const courierObj = Array.isArray(item.couriers)
      ? item.couriers[0]
      : item.couriers;
    const profileObj = courierObj?.profiles
      ? Array.isArray(courierObj.profiles)
        ? courierObj.profiles[0]
        : courierObj.profiles
      : null;

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
      courierName: profileObj?.full_name || "Kurir",
      courierCode: courierObj?.courier_code || "JF-KURIR",
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
      isEditableByCourier: false,
    };
  });

  const summary = buildAdminReportSummary(allReports, total);
  const offset = (page - 1) * perPage;
  const reports = allReports.slice(offset, offset + perPage);

  return {
    reports,
    total,
    page,
    perPage,
    totalPages,
    summary,
  };
}

/**
 * Server Action: Delete Daily Operational Report (Admin ONLY)
 * Couriers are strictly prohibited from deleting any daily report (own or others).
 */
export async function deleteDailyReportAction(
  reportId: string
): Promise<DailyReportActionResult> {
  await requireAdmin();

  if (!reportId || typeof reportId !== "string" || !reportId.trim()) {
    return { success: false, error: "ID laporan tidak valid." };
  }

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const idx = localMockReports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }
    localMockReports.splice(idx, 1);
    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    revalidatePath("/courier/history");
    return { success: true, message: "Laporan berhasil dihapus oleh Admin." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("daily_reports")
    .delete()
    .eq("id", reportId);

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockReportEntry[]>(
      REPORTS_CLOUD_FILE,
      []
    );
    const idx = cloudList.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }
    cloudList.splice(idx, 1);
    await writeCloudJson(REPORTS_CLOUD_FILE, cloudList);
    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    revalidatePath("/courier/history");
    return { success: true, message: "Laporan berhasil dihapus oleh Admin." };
  }

  if (error) {
    return {
      success: false,
      error: `Gagal menghapus laporan: ${error.message}`,
    };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/dashboard");
  revalidatePath("/courier/history");
  revalidatePath("/courier/dashboard");

  return { success: true, message: "Laporan berhasil dihapus oleh Admin." };
}
