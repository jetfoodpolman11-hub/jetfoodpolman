"use server";

import { revalidatePath } from "next/cache";
import { requireCourier, requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getWitaDateString, formatWitaDateTime } from "@/lib/date";

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
  status: "BELUM_ABSEN" | "SUDAH_MASUK" | "SUDAH_PULANG";
  statusLabel: string;
}

export interface AttendanceActionResult {
  success: boolean;
  error?: string;
  message?: string;
  record?: AttendanceRecord;
}

// In-memory mock storage for local development preview without live database
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
  created_at: string;
  updated_at: string;
}

// Pre-seeded demo record for yesterday
let localMockAttendance: MockAttendanceEntry[] = [
  {
    id: "att-seed-yesterday",
    courier_id: "mock-courier-rec-id",
    courier_name: "Kurir Lapangan Ali",
    courier_code: "JF-001",
    date: "2026-10-01",
    clock_in_time: "2026-10-01T00:05:00.000Z", // 08:05 WITA
    clock_out_time: "2026-10-01T09:15:00.000Z", // 17:15 WITA
    clock_in_notes: "Kondisi motor prima, siap rute Polewali Mandar",
    clock_out_notes: "Selesai 18 pengantaran, paket aman",
    created_at: "2026-10-01T00:05:00.000Z",
    updated_at: "2026-10-01T09:15:00.000Z",
  },
];

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
 * Reset local mock attendance for clean automated tests
 */
export async function resetMockAttendanceForTesting() {
  localMockAttendance = [
    {
      id: "att-seed-yesterday",
      courier_id: "mock-courier-rec-id",
      courier_name: "Kurir Lapangan Ali",
      courier_code: "JF-001",
      date: "2026-10-01",
      clock_in_time: "2026-10-01T00:05:00.000Z",
      clock_out_time: "2026-10-01T09:15:00.000Z",
      clock_in_notes: "Kondisi motor prima, siap rute Polewali Mandar",
      clock_out_notes: "Selesai 18 pengantaran, paket aman",
      created_at: "2026-10-01T00:05:00.000Z",
      updated_at: "2026-10-01T09:15:00.000Z",
    },
  ];
}

/**
 * Get today's attendance state for a specific courier
 */
export async function getTodayAttendanceForCourier(
  courierId: string
): Promise<TodayAttendanceState> {
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
      status: hasOut ? "SUDAH_PULANG" : "SUDAH_MASUK",
      statusLabel: hasOut ? "Sudah Absen Pulang" : "Sudah Absen Masuk",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("clock_in_time, clock_out_time, clock_in_notes, clock_out_notes")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (!data) {
    return {
      hasClockedIn: false,
      hasClockedOut: false,
      clockInTime: null,
      clockOutTime: null,
      clockInNotes: null,
      clockOutNotes: null,
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
  notes?: string
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
      message: `Absen masuk berhasil dicatat pada ${formatTimeWitaSync(nowIso)}.`,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = await createClient();

  // 1. Check double check-in
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "Anda sudah melakukan absen masuk hari ini. Mencegah absen ganda.",
    };
  }

  // 2. Insert attendance row
  const { error } = await supabase.from("attendance").insert({
    courier_id: courierId,
    date: todayWita,
    clock_in_time: nowIso,
    clock_in_notes: notes?.trim() || null,
  });

  if (error) {
    return { success: false, error: `Gagal mencatat presensi masuk: ${error.message}` };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Absen masuk berhasil dicatat pada ${formatTimeWitaSync(nowIso)}.`,
  };
}

/**
 * Server Action: Kurir Absen Pulang (Clock Out)
 * Requires existing valid clock-in record on today's WITA date.
 * Strictly prevents double clock-out.
 */
export async function clockOutAction(
  notes?: string
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

  // Local Mock Handling
  if (isPlaceholderEnv) {
    const existing = localMockAttendance.find(
      (a) => a.courier_id === courierId && a.date === todayWita
    );

    if (!existing) {
      return {
        success: false,
        error: "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
      };
    }

    if (existing.clock_out_time) {
      return {
        success: false,
        error: "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
      };
    }

    existing.clock_out_time = nowIso;
    existing.clock_out_notes = notes?.trim() || null;
    existing.updated_at = nowIso;

    revalidatePath("/courier/dashboard");
    revalidatePath("/courier/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Absen pulang berhasil dicatat pada ${formatTimeWitaSync(nowIso)}.`,
    };
  }

  // Supabase PostgreSQL Handling
  const supabase = await createClient();

  // 1. Check existing clock-in
  const { data: existing, error: checkError } = await supabase
    .from("attendance")
    .select("id, clock_in_time, clock_out_time")
    .eq("courier_id", courierId)
    .eq("date", todayWita)
    .maybeSingle();

  if (checkError || !existing) {
    return {
      success: false,
      error: "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
    };
  }

  if (existing.clock_out_time) {
    return {
      success: false,
      error: "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
    };
  }

  // 2. Update attendance row
  const { error: updateError } = await supabase
    .from("attendance")
    .update({
      clock_out_time: nowIso,
      clock_out_notes: notes?.trim() || null,
    })
    .eq("id", existing.id);

  if (updateError) {
    return { success: false, error: `Gagal mencatat presensi pulang: ${updateError.message}` };
  }

  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Absen pulang berhasil dicatat pada ${formatTimeWitaSync(nowIso)}.`,
  };
}

/**
 * Fetch attendance history for the logged-in courier only
 */
export async function getCourierAttendanceHistory(): Promise<AttendanceRecord[]> {
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
        status: a.clock_out_time ? "PULANG" : "MASUK",
        createdAt: a.created_at,
      }));
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance")
    .select("id, courier_id, date, clock_in_time, clock_out_time, clock_in_notes, clock_out_notes, created_at")
    .eq("courier_id", courierId)
    .order("date", { ascending: false })
    .order("clock_in_time", { ascending: false });

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
    status: item.clock_out_time ? "PULANG" : "MASUK",
    createdAt: item.created_at,
  }));
}

/**
 * Fetch all attendance records for Admin monitoring with date and courier filtering
 */
export async function getAdminAttendanceList(options?: {
  date?: string;
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
    if (options?.courierId && options.courierId !== "ALL") {
      filtered = filtered.filter((a) => a.courier_id === options.courierId);
    }

    return filtered.map((a) => ({
      id: a.id,
      courierId: a.courier_id,
      courierName: a.courier_name || "Kurir Lapangan Ali",
      courierCode: a.courier_code || "JF-001",
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

  const supabase = await createClient();

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

  if (options?.courierId && options.courierId !== "ALL") {
    query = query.eq("courier_id", options.courierId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching admin attendance:", error);
    return [];
  }

  return data.map((item) => {
    const courierObj = Array.isArray(item.couriers) ? item.couriers[0] : item.couriers;
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
      courierName: a.courier_name || "Kurir Lapangan Ali",
      courierCode: a.courier_code || "JF-001",
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

  const supabase = await createClient();

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

  if (error || !data) {
    console.error("Error fetching paginated admin attendance:", error);
    return { records: [], total: 0, page, perPage, totalPages: 1 };
  }

  const total = count ?? data.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const records: AttendanceRecord[] = data.map((item) => {
    const courierObj = Array.isArray(item.couriers) ? item.couriers[0] : item.couriers;
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
    return { success: false, error: "Alasan koreksi presensi wajib dicatat untuk audit trail." };
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

    return { success: true, message: "Koreksi data presensi berhasil disimpan." };
  }

  const supabase = await createClient();

  // Fetch current record
  const { data: current } = await supabase
    .from("attendance")
    .select("clock_out_notes")
    .eq("id", attendanceId)
    .single();

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
    return { success: false, error: `Gagal memperbarui presensi: ${error.message}` };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/courier/attendance");
  revalidatePath("/courier/dashboard");

  return { success: true, message: "Koreksi data presensi berhasil disimpan." };
}
