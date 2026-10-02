/**
 * TEST SUITE: PHASE 6 — ATTENDANCE SYSTEM
 * Verifies:
 * 1. Check-in (Clock In): Auto user_id, date, time in WITA
 * 2. Double Check-in prevention: Cannot clock in twice on the same day
 * 3. Check-out before check-in prevention: Cannot clock out without clock in
 * 4. Check-out (Clock Out): Valid clock in required, records timestamp
 * 5. Double Check-out prevention: Cannot clock out twice
 * 6. Timezone consistency: Asia/Makassar (WITA, UTC+8)
 * 7. Session handling & Unauthorized access protection
 * 8. Personal attendance history isolation (Courier A vs Courier B)
 * 9. Admin monitoring with date & courier filtering
 * 10. Admin manual correction with mandatory audit trail log
 */

import assert from "node:assert";

console.log("=== RUNNING PHASE 6: ATTENDANCE SYSTEM TEST SUITE ===\n");

// Constants & Enums
const ROLES = {
  ADMIN: "ADMIN",
  KURIR: "KURIR",
};

const DEFAULT_TIMEZONE = "Asia/Makassar";

// WITA helper functions
function getWitaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeWita(isoString) {
  if (!isoString) return null;
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: DEFAULT_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString)) + " WITA"
  );
}

function formatWitaDateTime(date = new Date()) {
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WITA`;
}

// Simulated Database Storage for Attendance
let attendanceTable = [];

// Sessions
const adminSession = {
  user: { id: "admin-uuid", email: "admin@jetfoodpolman.com" },
  profile: { id: "admin-uuid", role: ROLES.ADMIN, fullName: "Super Admin", isActive: true },
  courier: null,
};

const courierA = {
  user: { id: "courier-a-uuid", email: "kurir1@jetfoodpolman.com" },
  profile: { id: "courier-a-uuid", role: ROLES.KURIR, fullName: "Kurir Ali", isActive: true },
  courier: { id: "courier-rec-a", courierCode: "JF-001" },
};

const courierB = {
  user: { id: "courier-b-uuid", email: "kurir2@jetfoodpolman.com" },
  profile: { id: "courier-b-uuid", role: ROLES.KURIR, fullName: "Kurir Budi", isActive: true },
  courier: { id: "courier-rec-b", courierCode: "JF-002" },
};

// Simulation of Server Actions
function simulateClockIn(session, notes) {
  if (!session || !session.user || session.profile?.role !== ROLES.KURIR || !session.courier) {
    return { success: false, error: "Unauthorized: Kurir role required", statusCode: 403 };
  }

  const courierId = session.courier.id;
  const now = new Date();
  const todayWita = getWitaDateString(now);
  const nowIso = now.toISOString();

  // Prevent double check-in
  const existing = attendanceTable.find(
    (a) => a.courier_id === courierId && a.date === todayWita
  );
  if (existing) {
    return {
      success: false,
      error: "Anda sudah melakukan absen masuk hari ini. Mencegah absen ganda.",
    };
  }

  const record = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    courier_id: courierId,
    courier_name: session.profile.fullName,
    courier_code: session.courier.courierCode,
    date: todayWita,
    clock_in_time: nowIso,
    clock_out_time: null,
    clock_in_notes: notes ? notes.trim() : null,
    clock_out_notes: null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  attendanceTable.push(record);

  return {
    success: true,
    message: `Absen masuk berhasil dicatat pada ${formatTimeWita(nowIso)}.`,
    record,
  };
}

function simulateClockOut(session, notes) {
  if (!session || !session.user || session.profile?.role !== ROLES.KURIR || !session.courier) {
    return { success: false, error: "Unauthorized: Kurir role required", statusCode: 403 };
  }

  const courierId = session.courier.id;
  const now = new Date();
  const todayWita = getWitaDateString(now);
  const nowIso = now.toISOString();

  // Prevent check-out before check-in
  const existing = attendanceTable.find(
    (a) => a.courier_id === courierId && a.date === todayWita
  );
  if (!existing) {
    return {
      success: false,
      error: "Anda belum melakukan absen masuk hari ini. Silakan absen masuk terlebih dahulu.",
    };
  }

  // Prevent double check-out
  if (existing.clock_out_time) {
    return {
      success: false,
      error: "Anda sudah melakukan absen pulang hari ini. Mencegah absen pulang ganda.",
    };
  }

  existing.clock_out_time = nowIso;
  existing.clock_out_notes = notes ? notes.trim() : null;
  existing.updated_at = nowIso;

  return {
    success: true,
    message: `Absen pulang berhasil dicatat pada ${formatTimeWita(nowIso)}.`,
    record: existing,
  };
}

function simulateGetCourierAttendance(session) {
  if (!session || !session.user || session.profile?.role !== ROLES.KURIR || !session.courier) {
    return [];
  }
  return attendanceTable
    .filter((a) => a.courier_id === session.courier.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function simulateGetAdminAttendance(session, filters = {}) {
  if (!session || !session.user || session.profile?.role !== ROLES.ADMIN) {
    throw new Error("Unauthorized: Admin role required");
  }

  let result = [...attendanceTable];
  if (filters.date) {
    result = result.filter((a) => a.date === filters.date);
  }
  if (filters.courierId && filters.courierId !== "ALL") {
    result = result.filter((a) => a.courier_id === filters.courierId);
  }
  return result;
}

function simulateAdminCorrectAttendance(session, attendanceId, data) {
  if (!session || !session.user || session.profile?.role !== ROLES.ADMIN) {
    return { success: false, error: "Unauthorized: Admin role required", statusCode: 403 };
  }

  if (!data.reason || !data.reason.trim()) {
    return { success: false, error: "Alasan koreksi presensi wajib dicatat untuk audit trail." };
  }

  const record = attendanceTable.find((a) => a.id === attendanceId);
  if (!record) {
    return { success: false, error: "Data presensi tidak ditemukan." };
  }

  const adminEmail = session.user.email;
  const auditTimestamp = formatWitaDateTime(new Date());
  const auditNote = `[Koreksi Admin oleh ${adminEmail} pada ${auditTimestamp}: ${data.reason.trim()}]`;

  if (data.clockInTime) record.clock_in_time = data.clockInTime;
  if (data.clockOutTime) record.clock_out_time = data.clockOutTime;
  record.clock_out_notes = record.clock_out_notes
    ? `${record.clock_out_notes}\n${auditNote}`
    : auditNote;
  record.updated_at = new Date().toISOString();

  return {
    success: true,
    message: "Koreksi data presensi berhasil disimpan.",
    record,
  };
}

// -----------------------------------------------------------------------------
// TEST 1: Courier Absen Masuk (Clock In)
// -----------------------------------------------------------------------------
console.log("TEST 1: Courier Absen Masuk (Clock In)");
const inRes1 = simulateClockIn(courierA, "Armada siap operasi");
assert.strictEqual(inRes1.success, true);
assert.strictEqual(inRes1.record.courier_id, "courier-rec-a");
assert.strictEqual(inRes1.record.date, getWitaDateString());
assert.ok(inRes1.record.clock_in_time);
assert.strictEqual(inRes1.record.clock_out_time, null);
assert.strictEqual(inRes1.record.clock_in_notes, "Armada siap operasi");
console.log(`✓ PASSED: Check-in recorded at ${formatTimeWita(inRes1.record.clock_in_time)} for date ${inRes1.record.date}\n`);

// -----------------------------------------------------------------------------
// TEST 2: Double Check-in Prevention
// -----------------------------------------------------------------------------
console.log("TEST 2: Double Check-in Prevention");
const inResDuplicate = simulateClockIn(courierA, "Mencoba absen kedua");
assert.strictEqual(inResDuplicate.success, false);
assert.ok(inResDuplicate.error.includes("Mencegah absen ganda"));
console.log("✓ PASSED: Duplicate check-in strictly rejected on the same calendar day\n");

// -----------------------------------------------------------------------------
// TEST 3: Check-out Before Check-in Prevention
// -----------------------------------------------------------------------------
console.log("TEST 3: Check-out Before Check-in Prevention (Courier B)");
const outResNoIn = simulateClockOut(courierB, "Mencoba checkout langsung");
assert.strictEqual(outResNoIn.success, false);
assert.ok(outResNoIn.error.includes("belum melakukan absen masuk"));
console.log("✓ PASSED: Clock-out rejected when no valid check-in exists for today\n");

// -----------------------------------------------------------------------------
// TEST 4: Courier Absen Pulang (Clock Out)
// -----------------------------------------------------------------------------
console.log("TEST 4: Courier Absen Pulang (Clock Out)");
const outResValid = simulateClockOut(courierA, "Semua pengantaran tuntas");
assert.strictEqual(outResValid.success, true);
assert.ok(outResValid.record.clock_out_time);
assert.strictEqual(outResValid.record.clock_out_notes, "Semua pengantaran tuntas");
console.log(`✓ PASSED: Clock-out recorded successfully at ${formatTimeWita(outResValid.record.clock_out_time)}\n`);

// -----------------------------------------------------------------------------
// TEST 5: Double Check-out Prevention
// -----------------------------------------------------------------------------
console.log("TEST 5: Double Check-out Prevention");
const outResDuplicate = simulateClockOut(courierA, "Checkout ulang");
assert.strictEqual(outResDuplicate.success, false);
assert.ok(outResDuplicate.error.includes("Mencegah absen pulang ganda"));
console.log("✓ PASSED: Duplicate check-out rejected once clock-out is recorded\n");

// -----------------------------------------------------------------------------
// TEST 6: Timezone Verification (WITA / Asia/Makassar)
// -----------------------------------------------------------------------------
console.log("TEST 6: Timezone Verification (Asia/Makassar UTC+8)");
const testDate = new Date("2026-10-02T00:30:00.000Z"); // 00:30 UTC = 08:30 WITA
const formattedTime = formatTimeWita(testDate.toISOString());
assert.strictEqual(formattedTime, "08.30 WITA");
const witaDate = getWitaDateString(testDate);
assert.strictEqual(witaDate, "2026-10-02");
console.log("✓ PASSED: Correct WITA (UTC+8) time and date resolution verified\n");

// -----------------------------------------------------------------------------
// TEST 7: Session & Role Access Control
// -----------------------------------------------------------------------------
console.log("TEST 7: Session & Role Access Control");
const unauthIn = simulateClockIn(null);
assert.strictEqual(unauthIn.success, false);
assert.strictEqual(unauthIn.statusCode, 403);

const adminAttemptCourier = simulateClockIn(adminSession);
assert.strictEqual(adminAttemptCourier.success, false);
assert.strictEqual(adminAttemptCourier.statusCode, 403);

assert.throws(() => {
  simulateGetAdminAttendance(courierA);
}, /Unauthorized: Admin role required/);
console.log("✓ PASSED: Unauthenticated, Admin, and Courier roles properly restricted\n");

// -----------------------------------------------------------------------------
// TEST 8: Data Isolation Between Couriers
// -----------------------------------------------------------------------------
console.log("TEST 8: Courier Personal History Isolation");
// Clock in Courier B on today
const inResB = simulateClockIn(courierB, "Kurir B hadir");
assert.strictEqual(inResB.success, true);

const historyA = simulateGetCourierAttendance(courierA);
const historyB = simulateGetCourierAttendance(courierB);

assert.strictEqual(historyA.length, 1);
assert.strictEqual(historyA[0].courier_id, "courier-rec-a");

assert.strictEqual(historyB.length, 1);
assert.strictEqual(historyB[0].courier_id, "courier-rec-b");

// Ensure Courier A does not see Courier B's entry
assert.ok(!historyA.some((h) => h.courier_id === "courier-rec-b"));
console.log("✓ PASSED: Complete data isolation between couriers verified\n");

// -----------------------------------------------------------------------------
// TEST 9: Admin Attendance Monitoring & Filtering
// -----------------------------------------------------------------------------
console.log("TEST 9: Admin Attendance Monitoring & Filtering");
// Admin sees all records
const allAdmin = simulateGetAdminAttendance(adminSession);
assert.strictEqual(allAdmin.length, 2);

// Admin filters by date
const dateFiltered = simulateGetAdminAttendance(adminSession, { date: getWitaDateString() });
assert.strictEqual(dateFiltered.length, 2);

// Admin filters by courier ID
const courierFiltered = simulateGetAdminAttendance(adminSession, { courierId: "courier-rec-a" });
assert.strictEqual(courierFiltered.length, 1);
assert.strictEqual(courierFiltered[0].courier_id, "courier-rec-a");
console.log("✓ PASSED: Admin monitoring successfully filters by date and courier\n");

// -----------------------------------------------------------------------------
// TEST 10: Admin Manual Correction with Mandatory Audit Trail
// -----------------------------------------------------------------------------
console.log("TEST 10: Admin Manual Correction with Audit Trail");
const recordToCorrect = allAdmin[0];

// 1. Correction without reason fails
const corrNoReason = simulateAdminCorrectAttendance(adminSession, recordToCorrect.id, {
  reason: "",
});
assert.strictEqual(corrNoReason.success, false);
assert.ok(corrNoReason.error.includes("Alasan koreksi presensi wajib dicatat"));

// 2. Correction with valid reason succeeds and records audit tag
const corrValid = simulateAdminCorrectAttendance(adminSession, recordToCorrect.id, {
  clockInTime: "2026-10-02T07:45:00.000Z",
  reason: "Konfirmasi keterlambatan sinyal GPS lapangan",
});
assert.strictEqual(corrValid.success, true);
assert.ok(corrValid.record.clock_out_notes.includes("[Koreksi Admin oleh admin@jetfoodpolman.com"));
assert.ok(corrValid.record.clock_out_notes.includes("Konfirmasi keterlambatan sinyal GPS lapangan"));
console.log("✓ PASSED: Admin correction enforces mandatory audit trail with administrator email\n");

console.log("=================================================");
console.log("ALL 10 TESTS IN PHASE 6 TEST SUITE PASSED!");
console.log("=================================================");
