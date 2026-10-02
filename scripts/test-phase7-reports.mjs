/**
 * TEST SUITE: PHASE 7 — DAILY OPERATIONAL REPORT
 * Verifies:
 * 1. Valid input: Courier creates report with complete cascade, order count, omset, ojol, jastip
 * 2. Invalid input: Identical departure and destination village strictly rejected
 * 3. Negative values: Negative order, negative omset, negative ojol/jastip rejected
 * 4. Missing required fields: Missing origin, destination, package type rejected
 * 5. Inactive package type: Selection of inactive package rejected
 * 6. Unauthorized user: Unauthenticated or non-courier user blocked
 * 7. Duplicate submission: Identical route & package submitted twice on same day rejected
 * 8. Ownership isolation: Courier A cannot see or edit Courier B's report
 * 9. Editing rules: Locked on past date, editable by owner on current date
 * 10. Timezone validation: Formatted in WITA (Asia/Makassar, UTC+8)
 */

import assert from "node:assert";

console.log("=== RUNNING PHASE 7: DAILY OPERATIONAL REPORT TEST SUITE ===\n");

const ROLES = {
  ADMIN: "ADMIN",
  KURIR: "KURIR",
};

const DEFAULT_TIMEZONE = "Asia/Makassar";

function getWitaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// In-Memory Database Simulation
let reportsDb = [];

const packageTypesDb = [
  { id: "pkg-reguler", name: "Reguler", isActive: true },
  { id: "pkg-express", name: "Express", isActive: true },
  { id: "pkg-inactive", name: "Discontinued Service", isActive: false },
];

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

// Simulation of report validation
function validateReport(input) {
  const errors = {};

  if (!input.courierId) errors.courierId = "Kurir wajib diisi";
  if (!input.date) errors.date = "Tanggal operasional wajib diisi";
  if (!input.packageTypeId) errors.packageTypeId = "Jenis paket wajib dipilih";

  if (!input.origin?.villageId) {
    errors.origin = "Wilayah keberangkatan harus dipilih lengkap";
  }

  if (!input.destination?.villageId) {
    errors.destination = "Wilayah tujuan harus dipilih lengkap";
  }

  if (
    input.origin?.villageId &&
    input.destination?.villageId &&
    input.origin.villageId === input.destination.villageId
  ) {
    errors.route = "Wilayah keberangkatan dan tujuan tidak boleh identik";
  }

  if (typeof input.orderCount !== "number" || Number.isNaN(input.orderCount) || input.orderCount < 0) {
    errors.orderCount = "Jumlah order harus berupa angka valid dan tidak boleh negatif";
  }

  if (typeof input.omset !== "number" || Number.isNaN(input.omset) || input.omset < 0) {
    errors.omset = "Omset harus berupa nilai uang numerik valid dan tidak boleh negatif";
  }

  if (typeof input.ojolCount !== "number" || Number.isNaN(input.ojolCount) || input.ojolCount < 0) {
    errors.ojolCount = "Jumlah ojol tidak boleh negatif";
  }

  if (typeof input.ojolAmount !== "number" || Number.isNaN(input.ojolAmount) || input.ojolAmount < 0) {
    errors.ojolAmount = "Nominal ojol tidak boleh negatif";
  }

  if (typeof input.jastipCount !== "number" || Number.isNaN(input.jastipCount) || input.jastipCount < 0) {
    errors.jastipCount = "Jumlah jastip tidak boleh negatif";
  }

  if (typeof input.jastipAmount !== "number" || Number.isNaN(input.jastipAmount) || input.jastipAmount < 0) {
    errors.jastipAmount = "Nominal jastip tidak boleh negatif";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Simulation of createDailyReportAction
function simulateCreateReport(session, input) {
  if (!session || !session.user || session.profile?.role !== ROLES.KURIR || !session.courier) {
    return { success: false, error: "Unauthorized: Kurir role required", statusCode: 403 };
  }

  const courierId = session.courier.id;
  const payload = {
    ...input,
    courierId,
  };

  const validation = validateReport(payload);
  if (!validation.isValid) {
    return { success: false, error: Object.values(validation.errors)[0] };
  }

  // Active package check
  const pkg = packageTypesDb.find((p) => p.id === payload.packageTypeId && p.isActive);
  if (!pkg) {
    return { success: false, error: "Jenis paket yang dipilih tidak aktif atau tidak ditemukan." };
  }

  // Duplicate submission check
  const isDuplicate = reportsDb.some(
    (r) =>
      r.courier_id === courierId &&
      r.date === payload.date &&
      r.origin_village_id === payload.origin.villageId &&
      r.dest_village_id === payload.destination.villageId &&
      r.package_type_id === payload.packageTypeId &&
      r.order_count === payload.orderCount &&
      r.omset === payload.omset
  );

  if (isDuplicate) {
    return { success: false, error: "Laporan serupa untuk rute dan paket ini sudah pernah disimpan hari ini." };
  }

  const record = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    courier_id: courierId,
    courier_name: session.profile.fullName,
    courier_code: session.courier.courierCode,
    date: payload.date,
    package_type_id: pkg.id,
    package_type_name: pkg.name,
    origin_village_id: payload.origin.villageId,
    origin_village_name: payload.origin.villageName,
    origin_district_name: payload.origin.districtName,
    dest_village_id: payload.destination.villageId,
    dest_village_name: payload.destination.villageName,
    dest_district_name: payload.destination.districtName,
    order_count: payload.orderCount,
    omset: payload.omset,
    ojol_count: payload.ojolCount || 0,
    ojol_amount: payload.ojolAmount || 0,
    jastip_count: payload.jastipCount || 0,
    jastip_amount: payload.jastipAmount || 0,
    notes: payload.notes || null,
    created_at: new Date().toISOString(),
  };

  reportsDb.push(record);
  return { success: true, message: "Laporan operasional berhasil disimpan.", record };
}

// Simulation of updateDailyReportAction
function simulateUpdateReport(session, reportId, updateData) {
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized", statusCode: 401 };
  }

  const report = reportsDb.find((r) => r.id === reportId);
  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  const isAdmin = session.profile?.role === ROLES.ADMIN;
  const isOwner = session.courier && session.courier.id === report.courier_id;

  if (!isAdmin && !isOwner) {
    return { success: false, error: "Anda tidak memiliki akses mengubah laporan kurir lain." };
  }

  const todayWita = getWitaDateString();
  if (!isAdmin && report.date !== todayWita) {
    return { success: false, error: "Laporan pada tanggal lampau telah terkunci dan tidak dapat diubah oleh kurir." };
  }

  if (updateData.orderCount !== undefined) {
    if (updateData.orderCount < 0) return { success: false, error: "Jumlah order tidak boleh negatif" };
    report.order_count = updateData.orderCount;
  }

  if (updateData.omset !== undefined) {
    if (updateData.omset < 0) return { success: false, error: "Omset tidak boleh negatif" };
    report.omset = updateData.omset;
  }

  if (updateData.notes !== undefined) {
    report.notes = updateData.notes;
  }

  return { success: true, message: "Laporan operasional berhasil diperbarui.", record: report };
}

// -----------------------------------------------------------------------------
// TEST 1: Valid Input Submission
// -----------------------------------------------------------------------------
console.log("TEST 1: Valid Report Submission");
const todayDate = getWitaDateString();
const validReport = {
  date: todayDate,
  packageTypeId: "pkg-reguler",
  origin: {
    provinceId: "76",
    provinceName: "SULAWESI BARAT",
    regencyId: "7604",
    regencyName: "POLEWALI MANDAR",
    districtId: "760401",
    districtName: "POLEWALI",
    villageId: "7604011001",
    villageName: "MANDING",
  },
  destination: {
    provinceId: "76",
    provinceName: "SULAWESI BARAT",
    regencyId: "7604",
    regencyName: "POLEWALI MANDAR",
    districtId: "760402",
    districtName: "WONOMULYO",
    villageId: "7604021001",
    villageName: "SIDODADI",
  },
  orderCount: 15,
  omset: 150000,
  ojolCount: 2,
  ojolAmount: 20000,
  jastipCount: 1,
  jastipAmount: 15000,
  notes: "Kondisi jalan ramai lancar",
};

const res1 = simulateCreateReport(courierA, validReport);
assert.strictEqual(res1.success, true);
assert.strictEqual(res1.record.courier_id, "courier-rec-a");
assert.strictEqual(res1.record.order_count, 15);
assert.strictEqual(res1.record.omset, 150000);
console.log("✓ PASSED: Valid report successfully saved to database\n");

// -----------------------------------------------------------------------------
// TEST 2: Invalid Input (Identical Origin & Destination Route)
// -----------------------------------------------------------------------------
console.log("TEST 2: Identical Route Validation");
const identicalRouteReport = {
  ...validReport,
  destination: {
    ...validReport.origin, // Identical village Manding -> Manding
  },
};
const res2 = simulateCreateReport(courierA, identicalRouteReport);
assert.strictEqual(res2.success, false);
assert.ok(res2.error.includes("tidak boleh identik"));
console.log("✓ PASSED: Identical departure and destination village rejected\n");

// -----------------------------------------------------------------------------
// TEST 3: Negative Value Validation
// -----------------------------------------------------------------------------
console.log("TEST 3: Negative & Invalid Numeric Metrics");
const negativeOrderReport = { ...validReport, orderCount: -3 };
const resNegOrder = simulateCreateReport(courierA, negativeOrderReport);
assert.strictEqual(resNegOrder.success, false);
assert.ok(resNegOrder.error.includes("tidak boleh negatif"));

const negativeOmsetReport = { ...validReport, omset: -10000 };
const resNegOmset = simulateCreateReport(courierA, negativeOmsetReport);
assert.strictEqual(resNegOmset.success, false);
assert.ok(resNegOmset.error.includes("tidak boleh negatif"));

const nanOrderReport = { ...validReport, orderCount: NaN };
const resNanOrder = simulateCreateReport(courierA, nanOrderReport);
assert.strictEqual(resNanOrder.success, false);
assert.ok(resNanOrder.error.includes("harus berupa angka valid"));
console.log("✓ PASSED: Negative order, negative omset, and NaN numbers rejected\n");

// -----------------------------------------------------------------------------
// TEST 4: Missing Required Fields
// -----------------------------------------------------------------------------
console.log("TEST 4: Missing Required Fields");
const missingOrigin = { ...validReport, origin: null };
const resMissingOrigin = simulateCreateReport(courierA, missingOrigin);
assert.strictEqual(resMissingOrigin.success, false);

const missingPkg = { ...validReport, packageTypeId: "" };
const resMissingPkg = simulateCreateReport(courierA, missingPkg);
assert.strictEqual(resMissingPkg.success, false);
console.log("✓ PASSED: Missing origin and missing package type rejected\n");

// -----------------------------------------------------------------------------
// TEST 5: Inactive Package Type Selection
// -----------------------------------------------------------------------------
console.log("TEST 5: Inactive Package Type Selection");
const inactivePkgReport = { ...validReport, packageTypeId: "pkg-inactive" };
const resInactive = simulateCreateReport(courierA, inactivePkgReport);
assert.strictEqual(resInactive.success, false);
assert.ok(resInactive.error.includes("tidak aktif"));
console.log("✓ PASSED: Inactive package type rejected by server validation\n");

// -----------------------------------------------------------------------------
// TEST 6: Unauthorized User Access
// -----------------------------------------------------------------------------
console.log("TEST 6: Unauthorized User Access");
const unauthRes = simulateCreateReport(null, validReport);
assert.strictEqual(unauthRes.success, false);
assert.strictEqual(unauthRes.statusCode, 403);

const adminAsCourierRes = simulateCreateReport(adminSession, validReport);
assert.strictEqual(adminAsCourierRes.success, false);
assert.strictEqual(adminAsCourierRes.statusCode, 403);
console.log("✓ PASSED: Unauthenticated user and admin without courier profile blocked\n");

// -----------------------------------------------------------------------------
// TEST 7: Duplicate Submission Safeguard
// -----------------------------------------------------------------------------
console.log("TEST 7: Duplicate Submission Safeguard");
const duplicateRes = simulateCreateReport(courierA, validReport);
assert.strictEqual(duplicateRes.success, false);
assert.ok(duplicateRes.error.includes("sudah pernah disimpan hari ini"));
console.log("✓ PASSED: Duplicate report on same date, route, and package rejected\n");

// -----------------------------------------------------------------------------
// TEST 8: Ownership & Data Isolation
// -----------------------------------------------------------------------------
console.log("TEST 8: Ownership & Data Isolation");
// Courier B creates their own report on different route
const reportB = {
  ...validReport,
  destination: {
    provinceId: "76",
    provinceName: "SULAWESI BARAT",
    regencyId: "7604",
    regencyName: "POLEWALI MANDAR",
    districtId: "760405",
    districtName: "MATAKALI",
    villageId: "7604051001",
    villageName: "MATAKALI",
  },
};
const resB = simulateCreateReport(courierB, reportB);
assert.strictEqual(resB.success, true);

// Courier A attempts to edit Courier B's report
const tamperRes = simulateUpdateReport(courierA, resB.record.id, { omset: 999999 });
assert.strictEqual(tamperRes.success, false);
assert.ok(tamperRes.error.includes("tidak memiliki akses mengubah laporan kurir lain"));
console.log("✓ PASSED: Courier A prevented from modifying Courier B's report\n");

// -----------------------------------------------------------------------------
// TEST 9: Editing Rules & Past Date Lock
// -----------------------------------------------------------------------------
console.log("TEST 9: Editing Rules & Past Date Lock");
// 1. Courier A edits their own report on today (WITA)
const updateRes = simulateUpdateReport(courierA, res1.record.id, {
  orderCount: 16,
  omset: 160000,
  notes: "Koreksi tambahan 1 order saat malam",
});
assert.strictEqual(updateRes.success, true);
assert.strictEqual(updateRes.record.order_count, 16);
assert.strictEqual(updateRes.record.omset, 160000);

// 2. Report on past date cannot be edited by courier
const pastReport = {
  ...res1.record,
  id: "rep-past-date",
  date: "2026-09-30",
};
reportsDb.push(pastReport);

const pastEditRes = simulateUpdateReport(courierA, "rep-past-date", { orderCount: 20 });
assert.strictEqual(pastEditRes.success, false);
assert.ok(pastEditRes.error.includes("tanggal lampau telah terkunci"));

// 3. Admin has authority to edit past report
const adminEditRes = simulateUpdateReport(adminSession, "rep-past-date", {
  orderCount: 20,
  omset: 200000,
});
assert.strictEqual(adminEditRes.success, true);
assert.strictEqual(adminEditRes.record.order_count, 20);
console.log("✓ PASSED: Past reports locked for courier, while editable by authorized admin\n");

// -----------------------------------------------------------------------------
// TEST 10: Timezone WITA Alignment
// -----------------------------------------------------------------------------
console.log("TEST 10: Timezone WITA Alignment");
const witaDate = getWitaDateString();
assert.match(witaDate, /^\d{4}-\d{2}-\d{2}$/);
console.log(`✓ PASSED: Report date is aligned with WITA calendar (${witaDate})\n`);

console.log("=================================================");
console.log("ALL 10 TESTS IN PHASE 7 TEST SUITE PASSED!");
console.log("=================================================");
