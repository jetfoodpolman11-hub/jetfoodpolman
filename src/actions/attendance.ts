"use server";

import { revalidatePath } from "next/cache";
import { requireCourier, requireAdmin, requireAuth } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCloudJson, writeCloudJson } from "@/lib/supabase/cloud-json-store";
import { getWitaDateString, formatWitaDateTime } from "@/lib/date";
import { validateClockInInput } from "@/lib/validations/attendance";

export interface AttendanceRecord {
  id: string;
  courierId: string;
  courierName?: string;
  courierCode?: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // ISO
  clockOutTime: string | null; // ISO
  clockInTimeFormatted: string; // "08:01 WITA"
  clockOutTimeFormatted: string | null; // "17:15 WITA"
  clockInNotes: string | null;
  clockOutNotes: string | null;
  clockInLocation?: string | null;
  clockOutLocation?: string | null;
  status: "MASUK" | "PULANG";
  createdAt: string;
}

export interface TodayAttendanceState {
  hasClockedIn: boolean;
  hasClockedOut: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInNotes: string | null;
  clockOutNotes: string | null;
  clockInLocation?: string | null;
  clockOutLocation?: string | null;
  status: "BELUM_ABSEN" | "SUDAH_MASUK" | "SUDAH_PULANG";
  statusLabel: string;
}

export interface AttendanceActionResult {
  success: boolean;
  error?: string;
  message?: string;
  record?: AttendanceRecord;
}

interface MockAttendanceEntry {
  id: string;
  courier_id: string;
  courier_name?: string;
  courier_code?: string;
  date: string;
  clock_in_time: string;
  clock_out_time: string | null;
  clock_in_notes: string | null;
  clock_out_notes: string | null;
  clock_in_location?: string | null;
  clock_out_location?: string | null;
  created_at: string;
  updated_at: string;
}

// Empty initial store (all dummy/demo attendance history removed)
let localMockAttendance: MockAttendanceEntry[] = [];
const ATTENDANCE_CLOUD_FILE = "attendance.json";

/**
 * Format ISO timestamp into WITA time string (HH:mm WITA)
 */
export async function formatTimeWitaHelper(isoString?: string | null): Promise<string | null> {
  if (!isoString) return null;
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString)) + " WITA"
  );
}

function formatTimeWitaSync(isoString?: string | null): string | null {
  if (!isoString) return null;
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString)) + " WITA"
  );
}

/**
 * Reset local mock attendance for clean automated tests (Disabled in production)
 */
export async function resetMockAttendanceForTesting() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Operation forbidden in production environment.");
  }
  localMockAttendance = [];
}

/**
 * Get today's attendance state for a specific courier (Enforces ownership or Admin role)
 */
export async function getTodayAttendanceForCourier(
  courierId: string
): Promise<TodayAttendanceState> {
  const session = await requireAuth();
  const isAdmin = session.profile?.role === "ADMIN";
  if (!isAdmin && session.courier?.id !== courierId) {
    throw new Error("Akses ditolak: Anda tidak dapat mengakses data presensi kurir lain.");
  }

  const todayWita = getWitaDateString(new Date());

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const existing = localMockAttendance.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );

    if (!existing) {
      return {
        hasClockedIn: false,
        hasClockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        clockInNotes: null,
        clockOutNotes: null,
        clockInLocation: null,
        clockOutLocation: null,
        status: "BELUM_ABSEN",
        statusLabel: "Belum Absen",
      };
    }

    const hasOut = !!existing.clock_out_time;
    return {
      hasClockedIn: true,
      hasClockedOut: hasOut,
      clockInTime: formatTimeWitaSync(existing.clock_in_time),
      clockOutTime: formatTimeWitaSync(existing.clock_out_time),
      clockInNotes: existing.clock_in_notes,
      clockOutNotes: existing.clock_out_notes,
      clockInLocation:
        existing.clock_in_location ||
        (existing.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
          "Polewali Mandar"),
      clockOutLocation:
        existing.clock_out_location ||
        (existing.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null),
      status: hasOut ? "SUDAH_PULANG" : "SUDAH_MASUK",
      statusLabel: hasOut ? "Sudah Absen Pulang" : "Sudah Absen Masuk",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("clock_in_time, clock_out_time, clock_in_notes, clock_out_notes")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    const existing = cloudList.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );
    if (!existing) {
      return {
        hasClockedIn: false,
        hasClockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        clockInNotes: null,
        clockOutNotes: null,
        clockInLocation: null,
        clockOutLocation: null,
        status: "BELUM_ABSEN",
        statusLabel: "Belum Absen",
      };
    }
    const hasOut = !!existing.clock_out_time;
    return {
      hasClockedIn: true,
      hasClockedOut: hasOut,
      clockInTime: formatTimeWitaSync(existing.clock_in_time),
      clockOutTime: formatTimeWitaSync(existing.clock_out_time),
      clockInNotes: existing.clock_in_notes,
      clockOutNotes: existing.clock_out_notes,
      clockInLocation:
        existing.clock_in_location ||
        (existing.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
          "Polewali Mandar"),
      clockOutLocation:
        existing.clock_out_location ||
        (existing.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null),
      status: hasOut ? "SUDAH_PULANG" : "SUDAH_MASUK",
      statusLabel: hasOut ? "Sudah Absen Pulang" : "Sudah Absen Masuk",
    };
  }

  if (!data) {
    return {
      hasClockedIn: false,
      hasClockedOut: false,
      clockInTime: null,
      clockOutTime: null,
      clockInNotes: null,
      clockOutNotes: null,
      clockInLocation: null,
      clockOutLocation: null,
      status: "BELUM_ABSEN",
      statusLabel: "Belum Absen",
    };
  }

  const hasIn = !!data.clock_in_time;
  const hasOut = !!data.clock_out_time;

  return {
    hasClockedIn: hasIn,
    hasClockedOut: hasOut,
    clockInTime: formatTimeWitaSync(data.clock_in_time),
    clockOutTime: formatTimeWitaSync(data.clock_out_time),
    clockInNotes: data.clock_in_notes,
    clockOutNotes: data.clock_out_notes,
    clockInLocation:
      data.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
      "Polewali Mandar",
    clockOutLocation:
      data.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null,
    status: hasOut ? "SUDAH_PULANG" : "SUDAH_MASUK",
    statusLabel: hasOut ? "Sudah Absen Pulang" : "Sudah Absen Masuk",
  };
}

/**
 * Server Action: Kurir Absen Masuk (Clock In)
 * Automatically derives courier_id, system date in WITA, and server timestamp.
 * Strictly prevents double check-in on the same date.
 */
export async function clockInAction(
  notes?: string,
  location?: string
): Promise<AttendanceActionResult> {
  const session = await requireCourier();
  const courierId = session.courier?.id;

  if (!courierId) {
    return { success: false, error: "Identitas profil kurir tidak ditemukan." };
  }

  const now = new Date();
  const todayWita = getWitaDateString(now);
  const nowIso = now.toISOString();

  const validation = validateClockInInput({
    courierId,
    date: todayWita,
    notes,
  });
  if (!validation.isValid) {
    return {
      success: false,
      error: Object.values(validation.errors)[0] || "Data presensi tidak valid.",
    };
  }

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const effectiveLocation = location?.trim() || "Polewali Mandar (WITA)";

  // Local Mock Handling
  if (isPlaceholderEnv) {
    const existing = localMockAttendance.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );

    if (existing) {
      return {
        success: false,
        error: "Anda sudah melakukan absen masuk hari ini. Mencegah absen ganda.",
      };
    }

    const newRecord: MockAttendanceEntry = {
      id: `att-${Date.now()}`,
      courier_id: courierId,
      courier_name: session.profile?.fullName,
      courier_code: session.courier?.courierCode,
      date: todayWita,
      clock_in_time: nowIso,
      clock_out_time: null,
      clock_in_notes: notes?.trim() || null,
      clock_out_notes: null,
      clock_in_location: effectiveLocation,
      clock_out_location: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    localMockAttendance.unshift(newRecord);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Absen masuk berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = createAdminClient();

  // 1. Check double check-in
  const { data: existing, error: checkErr } = await supabase
    .from("attendance")
    .select("id")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (checkErr && checkErr.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    const dup = cloudList.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );
    if (dup) {
      return {
        success: false,
        error: "Anda sudah melakukan absen masuk hari ini. Mencegah absen ganda.",
      };
    }

    const newRecord: MockAttendanceEntry = {
      id: `att-${Date.now()}`,
      courier_id: courierId,
      courier_name: session.profile?.fullName,
      courier_code: session.courier?.courierCode,
      date: todayWita,
      clock_in_time: nowIso,
      clock_out_time: null,
      clock_in_notes: notes?.trim() || null,
      clock_out_notes: null,
      clock_in_location: effectiveLocation,
      clock_out_location: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    cloudList.unshift(newRecord);
    await writeCloudJson(ATTENDANCE_CLOUD_FILE, cloudList);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Absen masuk berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
    };
  }

  if (existing) {
    return {
      success: false,
      error: "Anda sudah melakukan absen masuk hari ini. Mencegah absen ganda.",
    };
  }

  const fullNotes = location
    ? `[Lokasi: ${location}] ${notes?.trim() || ""}`.trim()
    : notes?.trim() || null;

  // 2. Insert attendance row
  const { error } = await supabase.from("attendance").insert({
    courier_id: courierId,
    date: todayWita,
    clock_in_time: nowIso,
    clock_in_notes: fullNotes,
  });

  if (error) {
    return {
      success: false,
      error: `Gagal mencatat presensi masuk: ${error.message}`,
    };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Absen masuk berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
  };
}

/**
 * Server Action: Kurir Absen Pulang (Clock Out)
 * Requires existing valid clock-in record on today's WITA date.
 * Strictly prevents double clock-out.
 */
export async function clockOutAction(
  notes?: string,
  location?: string
): Promise<AttendanceActionResult> {
  const session = await requireCourier();
  const courierId = session.courier?.id;

  if (!courierId) {
    return { success: false, error: "Identitas profil kurir tidak ditemukan." };
  }

  const now = new Date();
  const todayWita = getWitaDateString(now);
  const nowIso = now.toISOString();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const effectiveLocation = location?.trim() || "Polewali Mandar (WITA)";

  // Local Mock Handling
  if (isPlaceholderEnv) {
    const existing = localMockAttendance.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );

    if (!existing) {
      return {
        success: false,
        error:
          "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
      };
    }

    if (existing.clock_out_time) {
      return {
        success: false,
        error:
          "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
      };
    }

    existing.clock_out_time = nowIso;
    existing.clock_out_notes = notes?.trim() || null;
    existing.clock_out_location = effectiveLocation;
    existing.updated_at = nowIso;

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Absen pulang berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = createAdminClient();

  // 1. Check existing clock-in
  const { data: existing, error: checkError } = await supabase
    .from("attendance")
    .select("id, clock_in_time, clock_out_time")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (checkError && checkError.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    const cloudRec = cloudList.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );
    if (!cloudRec) {
      return {
        success: false,
        error:
          "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
      };
    }
    if (cloudRec.clock_out_time) {
      return {
        success: false,
        error:
          "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
      };
    }

    cloudRec.clock_out_time = nowIso;
    cloudRec.clock_out_notes = notes?.trim() || null;
    cloudRec.clock_out_location = effectiveLocation;
    cloudRec.updated_at = nowIso;
    await writeCloudJson(ATTENDANCE_CLOUD_FILE, cloudList);

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Absen pulang berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
    };
  }

  if (checkError || !existing) {
    return {
      success: false,
      error:
        "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
    };
  }

  if (existing.clock_out_time) {
    return {
      success: false,
      error:
        "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
    };
  }

  const fullNotes = location
    ? `[Lokasi: ${location}] ${notes?.trim() || ""}`.trim()
    : notes?.trim() || null;

  // 2. Update attendance row
  const { error: updateError } = await supabase
    .from("attendance")
    .update({
      clock_out_time: nowIso,
      clock_out_notes: fullNotes,
    })
    .eq("id", existing.id);

  if (updateError) {
    return {
      success: false,
      error: `Gagal mencatat presensi pulang: ${updateError.message}`,
    };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Absen pulang berhasil dicatat pada ${formatTimeWitaSync(nowIso)} di ${effectiveLocation}.`,
  };
}

/**
 * Fetch attendance history for the logged-in courier only
 */
export async function getCourierAttendanceHistory(): Promise<
  AttendanceRecord[]
> {
  const session = await requireCourier();
  const courierId = session.courier?.id;

  if (!courierId) return [];

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    return localMockAttendance
      .filter((a) => a.courier_id === courierId)
      .map((a) => ({
        id: a.id,
        courierId: a.courier_id,
        courierName: session.profile?.fullName,
        courierCode: session.courier?.courierCode,
        date: a.date,
        clockInTime: a.clock_in_time,
        clockOutTime: a.clock_out_time,
        clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
        clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
        clockInNotes: a.clock_in_notes,
        clockOutNotes: a.clock_out_notes,
        clockInLocation:
          a.clock_in_location ||
          (a.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
            "Polewali Mandar"),
        clockOutLocation:
          a.clock_out_location ||
          (a.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null),
        status: a.clock_out_time ? "PULANG" : "MASUK",
        createdAt: a.created_at,
      }));
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, courier_id, date, clock_in_time, clock_out_time, clock_in_notes, clock_out_notes, created_at"
    )
    .eq("courier_id", courierId)
    .order("date", { ascending: false })
    .order("clock_in_time", { ascending: false });

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    return cloudList
      .filter((a) => a.courier_id === courierId)
      .map((a) => ({
        id: a.id,
        courierId: a.courier_id,
        courierName: session.profile?.fullName,
        courierCode: session.courier?.courierCode,
        date: a.date,
        clockInTime: a.clock_in_time,
        clockOutTime: a.clock_out_time,
        clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
        clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
        clockInNotes: a.clock_in_notes,
        clockOutNotes: a.clock_out_notes,
        clockInLocation:
          a.clock_in_location ||
          (a.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
            "Polewali Mandar"),
        clockOutLocation:
          a.clock_out_location ||
          (a.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null),
        status: a.clock_out_time ? "PULANG" : "MASUK",
        createdAt: a.created_at,
      }));
  }

  if (error || !data) {
    console.error("Error fetching courier attendance:", error);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    courierId: item.courier_id,
    courierName: session.profile?.fullName,
    courierCode: session.courier?.courierCode,
    date: item.date,
    clockInTime: item.clock_in_time,
    clockOutTime: item.clock_out_time,
    clockInTimeFormatted: formatTimeWitaSync(item.clock_in_time) || "—",
    clockOutTimeFormatted: formatTimeWitaSync(item.clock_out_time),
    clockInNotes: item.clock_in_notes,
    clockOutNotes: item.clock_out_notes,
    clockInLocation:
      item.clock_in_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ??
      "Polewali Mandar",
    clockOutLocation:
      item.clock_out_notes?.match(/\[Lokasi:\s*(.*?)\]/)?.[1] ?? null,
    status: item.clock_out_time ? "PULANG" : "MASUK",
    createdAt: item.created_at,
  }));
}

/**
 * Fetch all attendance records for Admin monitoring with date and courier filtering
 */
export async function getAdminAttendanceList(options?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  courierId?: string;
}): Promise<AttendanceRecord[]> {
  await requireAdmin();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    let filtered = [...localMockAttendance];
    if (options?.date) {
      filtered = filtered.filter((a) => a.date === options.date);
    }
    if (options?.startDate) {
      filtered = filtered.filter((a) => a.date >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter((a) => a.date <= options.endDate!);
    }
    if (options?.courierId && options.courierId !== "ALL") {
      filtered = filtered.filter((a) => a.courier_id === options.courierId);
    }

    return filtered.map((a) => ({
      id: a.id,
      courierId: a.courier_id,
      courierName: a.courier_name || "Kurir",
      courierCode: a.courier_code || "JF-KURIR",
      date: a.date,
      clockInTime: a.clock_in_time,
      clockOutTime: a.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
      clockInNotes: a.clock_in_notes,
      clockOutNotes: a.clock_out_notes,
      status: a.clock_out_time ? "PULANG" : "MASUK",
      createdAt: a.created_at,
    }));
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("attendance")
    .select(`
      id,
      courier_id,
      date,
      clock_in_time,
      clock_out_time,
      clock_in_notes,
      clock_out_notes,
      created_at,
      couriers:courier_id (
        courier_code,
        profiles:user_id ( full_name )
      )
    `)
    .order("date", { ascending: false })
    .order("clock_in_time", { ascending: false });

  if (options?.date) {
    query = query.eq("date", options.date);
  }
  if (options?.startDate) {
    query = query.gte("date", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("date", options.endDate);
  }

  if (options?.courierId && options.courierId !== "ALL") {
    query = query.eq("courier_id", options.courierId);
  }

  const { data, error } = await query;

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    let filtered = [...cloudList];
    if (options?.date) {
      filtered = filtered.filter((a) => a.date === options.date);
    }
    if (options?.startDate) {
      filtered = filtered.filter((a) => a.date >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter((a) => a.date <= options.endDate!);
    }
    if (options?.courierId && options.courierId !== "ALL") {
      filtered = filtered.filter((a) => a.courier_id === options.courierId);
    }

    return filtered.map((a) => ({
      id: a.id,
      courierId: a.courier_id,
      courierName: a.courier_name || "Kurir",
      courierCode: a.courier_code || "JF-KURIR",
      date: a.date,
      clockInTime: a.clock_in_time,
      clockOutTime: a.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
      clockInNotes: a.clock_in_notes,
      clockOutNotes: a.clock_out_notes,
      status: a.clock_out_time ? "PULANG" : "MASUK",
      createdAt: a.created_at,
    }));
  }

  if (error || !data) {
    console.error("Error fetching admin attendance:", error);
    return [];
  }

  return data.map((item) => {
    const courierObj = Array.isArray(item.couriers)
      ? item.couriers[0]
      : item.couriers;
    const profileObj = courierObj?.profiles
      ? Array.isArray(courierObj.profiles)
        ? courierObj.profiles[0]
        : courierObj.profiles
      : null;

    return {
      id: item.id,
      courierId: item.courier_id,
      courierName: profileObj?.full_name || "Kurir",
      courierCode: courierObj?.courier_code || "JF-KURIR",
      date: item.date,
      clockInTime: item.clock_in_time,
      clockOutTime: item.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(item.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(item.clock_out_time),
      clockInNotes: item.clock_in_notes,
      clockOutNotes: item.clock_out_notes,
      status: item.clock_out_time ? "PULANG" : "MASUK",
      createdAt: item.created_at,
    };
  });
}

export interface PaginatedAdminAttendance {
  records: AttendanceRecord[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Fetch paginated attendance records for Admin monitoring with server-side pagination
 */
export async function getAdminAttendancePaginated(options?: {
  date?: string;
  courierId?: string;
  page?: number;
  perPage?: number;
}): Promise<PaginatedAdminAttendance> {
  await requireAdmin();

  const page = Math.max(1, options?.page || 1);
  const perPage = Math.max(1, Math.min(100, options?.perPage || 10));

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    let filtered = [...localMockAttendance];
    if (options?.date && options.date !== "ALL") {
      filtered = filtered.filter((a) => a.date === options.date);
    }
    if (options?.courierId && options.courierId !== "ALL") {
      filtered = filtered.filter((a) => a.courier_id === options.courierId);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const offset = (page - 1) * perPage;
    const paged = filtered.slice(offset, offset + perPage);

    const records: AttendanceRecord[] = paged.map((a) => ({
      id: a.id,
      courierId: a.courier_id,
      courierName: a.courier_name || "Kurir",
      courierCode: a.courier_code || "JF-KURIR",
      date: a.date,
      clockInTime: a.clock_in_time,
      clockOutTime: a.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
      clockInNotes: a.clock_in_notes,
      clockOutNotes: a.clock_out_notes,
      status: a.clock_out_time ? "PULANG" : "MASUK",
      createdAt: a.created_at,
    }));

    return { records, total, page, perPage, totalPages };
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("attendance")
    .select(
      `
      id,
      courier_id,
      date,
      clock_in_time,
      clock_out_time,
      clock_in_notes,
      clock_out_notes,
      created_at,
      couriers:courier_id (
        courier_code,
        profiles:user_id ( full_name )
      )
    `,
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .order("clock_in_time", { ascending: false });

  if (options?.date && options.date !== "ALL") {
    query = query.eq("date", options.date);
  }

  if (options?.courierId && options.courierId !== "ALL") {
    query = query.eq("courier_id", options.courierId);
  }

  const offset = (page - 1) * perPage;
  query = query.range(offset, offset + perPage - 1);

  const { data, count, error } = await query;

  if (error && error.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    let filtered = [...cloudList];
    if (options?.date && options.date !== "ALL") {
      filtered = filtered.filter((a) => a.date === options.date);
    }
    if (options?.courierId && options.courierId !== "ALL") {
      filtered = filtered.filter((a) => a.courier_id === options.courierId);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const paged = filtered.slice(offset, offset + perPage);

    const records: AttendanceRecord[] = paged.map((a) => ({
      id: a.id,
      courierId: a.courier_id,
      courierName: a.courier_name || "Kurir",
      courierCode: a.courier_code || "JF-KURIR",
      date: a.date,
      clockInTime: a.clock_in_time,
      clockOutTime: a.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(a.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(a.clock_out_time),
      clockInNotes: a.clock_in_notes,
      clockOutNotes: a.clock_out_notes,
      status: a.clock_out_time ? "PULANG" : "MASUK",
      createdAt: a.created_at,
    }));

    return { records, total, page, perPage, totalPages };
  }

  if (error || !data) {
    console.error("Error fetching paginated admin attendance:", error);
    return { records: [], total: 0, page, perPage, totalPages: 1 };
  }

  const total = count ?? data.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const records: AttendanceRecord[] = data.map((item) => {
    const courierObj = Array.isArray(item.couriers)
      ? item.couriers[0]
      : item.couriers;
    const profileObj = courierObj?.profiles
      ? Array.isArray(courierObj.profiles)
        ? courierObj.profiles[0]
        : courierObj.profiles
      : null;

    return {
      id: item.id,
      courierId: item.courier_id,
      courierName: profileObj?.full_name || "Kurir",
      courierCode: courierObj?.courier_code || "JF-KURIR",
      date: item.date,
      clockInTime: item.clock_in_time,
      clockOutTime: item.clock_out_time,
      clockInTimeFormatted: formatTimeWitaSync(item.clock_in_time) || "—",
      clockOutTimeFormatted: formatTimeWitaSync(item.clock_out_time),
      clockInNotes: item.clock_in_notes,
      clockOutNotes: item.clock_out_notes,
      status: item.clock_out_time ? "PULANG" : "MASUK",
      createdAt: item.created_at,
    };
  });

  return { records, total, page, perPage, totalPages };
}

/**
 * Server Action: Admin manual attendance correction with mandatory audit trail
 */
export async function adminCorrectAttendanceAction(
  attendanceId: string,
  data: {
    clockInTime?: string;
    clockOutTime?: string;
    reason: string;
  }
): Promise<AttendanceActionResult> {
  const session = await requireAdmin();

  if (!data.reason || !data.reason.trim()) {
    return {
      success: false,
      error: "Alasan koreksi presensi wajib dicatat untuk audit trail.",
    };
  }

  const adminEmail = session.user.email;
  const auditTimestamp = formatWitaDateTime(new Date());
  const auditNote = `[Koreksi Admin oleh ${adminEmail} pada ${auditTimestamp}: ${data.reason.trim()}]`;

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const record = localMockAttendance.find((a) => a.id === attendanceId);
    if (!record) {
      return { success: false, error: "Data presensi tidak ditemukan." };
    }

    if (data.clockInTime) record.clock_in_time = data.clockInTime;
    if (data.clockOutTime) record.clock_out_time = data.clockOutTime;
    record.clock_out_notes = record.clock_out_notes
      ? `${record.clock_out_notes}\n${auditNote}`
      : auditNote;

    revalidatePath("/admin/attendance");
    revalidatePath("/courier/attendance");
    revalidatePath("/courier/dashboard");

    return {
      success: true,
      message: "Koreksi data presensi berhasil disimpan.",
    };
  }

  const supabase = createAdminClient();

  // Fetch current record
  const { data: current, error: fetchErr } = await supabase
    .from("attendance")
    .select("clock_out_notes")
    .eq("id", attendanceId)
    .single();

  if (fetchErr && fetchErr.message.includes("schema cache")) {
    const cloudList = await readCloudJson<MockAttendanceEntry[]>(
      ATTENDANCE_CLOUD_FILE,
      []
    );
    const record = cloudList.find((a) => a.id === attendanceId);
    if (!record) {
      return { success: false, error: "Data presensi tidak ditemukan." };
    }
    if (data.clockInTime) record.clock_in_time = data.clockInTime;
    if (data.clockOutTime) record.clock_out_time = data.clockOutTime;
    record.clock_out_notes = record.clock_out_notes
      ? `${record.clock_out_notes}\n${auditNote}`
      : auditNote;
    await writeCloudJson(ATTENDANCE_CLOUD_FILE, cloudList);

    revalidatePath("/admin/attendance");
    revalidatePath("/courier/attendance");
    revalidatePath("/courier/dashboard");

    return {
      success: true,
      message: "Koreksi data presensi berhasil disimpan.",
    };
  }

  const newNotes = current?.clock_out_notes
    ? `${current.clock_out_notes}\n${auditNote}`
    : auditNote;

  const updatePayload: {
    clock_out_notes: string;
    clock_in_time?: string;
    clock_out_time?: string;
  } = {
    clock_out_notes: newNotes,
  };

  if (data.clockInTime) updatePayload.clock_in_time = data.clockInTime;
  if (data.clockOutTime) updatePayload.clock_out_time = data.clockOutTime;

  const { error } = await supabase
    .from("attendance")
    .update(updatePayload)
    .eq("id", attendanceId);

  if (error) {
    return {
      success: false,
      error: `Gagal memperbarui presensi: ${error.message}`,
    };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/courier/attendance");
  revalidatePath("/courier/dashboard");

  return { success: true, message: "Koreksi data presensi berhasil disimpan." };
}
