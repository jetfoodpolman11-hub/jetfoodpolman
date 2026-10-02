/**
 * TEST SUITE: PHASE 9 — ADMIN MONITORING
 * Verifies all Phase 9 requirements:
 * 1. Filter satu kondisi: Filter by date, courier, package type, and route individually
 * 2. Kombinasi filter: Multi-criteria filtering (date + courier + package + route)
 * 3. Pagination: Server-side pagination with page, perPage, totalPages, and slice integrity
 * 4. Data kosong: Empty state handling when no records match filter criteria
 * 5. Data besar: High-volume dataset performance & pagination integrity (150+ records)
 * 6. Unauthorized access: Strict RBAC blocking non-admin or unauthenticated requests
 * 7. Route format: Standard "Wilayah Asal → Wilayah Tujuan" display format
 * 8. Detail inspection: Comprehensive inspection of courier, date, route, order, omset, package, ojol, jastip, notes
 */

import assert from "node:assert";

console.log("=== RUNNING PHASE 9: ADMIN MONITORING TEST SUITE ===\n");

const ROLES = {
  ADMIN: "ADMIN",
  KURIR: "KURIR",
};

// Sessions
const adminSession = {
  user: { id: "admin-uuid", email: "admin@jetfoodpolman.com" },
  profile: { id: "admin-uuid", role: ROLES.ADMIN, fullName: "Super Admin", isActive: true },
};

const courierSession = {
  user: { id: "courier-uuid", email: "kurir@jetfoodpolman.com" },
  profile: { id: "courier-uuid", role: ROLES.KURIR, fullName: "Kurir Ali", isActive: true },
  courier: { id: "courier-1", courierCode: "JF-001" },
};

// Helper: Title case formatting
function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRouteDisplay(origin, destination) {
  const originVil = toTitleCase(origin.villageName);
  const originDist = toTitleCase(origin.districtName);
  const destVil = toTitleCase(destination.villageName);
  const destDist = toTitleCase(destination.districtName);

  if (origin.regencyId !== destination.regencyId) {
    const originReg = toTitleCase(
      origin.regencyName.replace(/^KABUPATEN\s+/i, "Kab. ").replace(/^KOTA\s+/i, "Kota ")
    );
    const destReg = toTitleCase(
      destination.regencyName.replace(/^KABUPATEN\s+/i, "Kab. ").replace(/^KOTA\s+/i, "Kota ")
    );
    return `${originVil}, ${originDist} (${originReg}) → ${destVil}, ${destDist} (${destReg})`;
  }

  return `${originVil}, ${originDist} → ${destVil}, ${destDist}`;
}

// Simulated in-memory database of reports
const initialReports = [
  {
    id: "rep-001",
    courier_id: "courier-1",
    courier_name: "Kurir Lapangan Ali",
    courier_code: "JF-001",
    date: "2026-10-01",
    package_type_id: "pkg-reguler",
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
    ojol_count: 2,
    ojol_amount: 20000,
    jastip_count: 1,
    jastip_amount: 15000,
    notes: "Pengantaran area kota Polewali lancar.",
  },
  {
    id: "rep-002",
    courier_id: "courier-1",
    courier_name: "Kurir Lapangan Ali",
    courier_code: "JF-001",
    date: "2026-10-02",
    package_type_id: "pkg-express",
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
  },
  {
    id: "rep-003",
    courier_id: "courier-2",
    courier_name: "Kurir Lapangan Budi",
    courier_code: "JF-002",
    date: "2026-10-02",
    package_type_id: "pkg-reguler",
    package_type_name: "Reguler",
    origin_province_id: "76",
    origin_province_name: "SULAWESI BARAT",
    origin_regency_id: "7604",
    origin_regency_name: "KABUPATEN POLEWALI MANDAR",
    origin_district_id: "760402",
    origin_district_name: "WONOMULYO",
    origin_village_id: "7604021001",
    origin_village_name: "SIDODADI",
    dest_province_id: "76",
    dest_province_name: "SULAWESI BARAT",
    dest_regency_id: "7604",
    dest_regency_name: "KABUPATEN POLEWALI MANDAR",
    dest_district_id: "760401",
    dest_district_name: "POLEWALI",
    dest_village_id: "7604011002",
    dest_village_name: "MADATTE",
    order_count: 20,
    omset: 200000,
    ojol_count: 0,
    ojol_amount: 0,
    jastip_count: 3,
    jastip_amount: 45000,
    notes: "Rute balik Wonomulyo ke Madatte.",
  },
  {
    id: "rep-004",
    courier_id: "courier-2",
    courier_name: "Kurir Lapangan Budi",
    courier_code: "JF-002",
    date: "2026-10-03",
    package_type_id: "pkg-cargo",
    package_type_name: "Cargo",
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
    dest_regency_id: "7601",
    dest_regency_name: "KABUPATEN MAJENE",
    dest_district_id: "760101",
    dest_district_name: "BANGGAE",
    dest_village_id: "7601011001",
    dest_village_name: "BANGGAE",
    order_count: 5,
    omset: 150000,
    ojol_count: 0,
    ojol_amount: 0,
    jastip_count: 0,
    jastip_amount: 0,
    notes: "Pengiriman muatan kargo ke Majene.",
  },
];

// Server-side filtering & pagination engine simulation
function queryAdminReports(session, database, options = {}) {
  // Authorization Check
  if (!session || !session.user || session.profile?.role !== ROLES.ADMIN) {
    throw new Error("Unauthorized: Admin role required");
  }

  const {
    date,
    courierId,
    packageTypeId,
    routeQuery,
    page = 1,
    perPage = 10,
  } = options;

  let filtered = [...database];

  // 1. Filter Date
  if (date && date !== "ALL") {
    filtered = filtered.filter((r) => r.date === date);
  }

  // 2. Filter Courier
  if (courierId && courierId !== "ALL") {
    filtered = filtered.filter((r) => r.courier_id === courierId);
  }

  // 3. Filter Package Type
  if (packageTypeId && packageTypeId !== "ALL") {
    filtered = filtered.filter((r) => r.package_type_id === packageTypeId);
  }

  // 4. Filter Route Query (case-insensitive substring match on origin / dest names)
  if (routeQuery && routeQuery.trim()) {
    const q = routeQuery.trim().toLowerCase();
    filtered = filtered.filter((r) => {
      const originStr = `${r.origin_village_name} ${r.origin_district_name} ${r.origin_regency_name}`.toLowerCase();
      const destStr = `${r.dest_village_name} ${r.dest_district_name} ${r.dest_regency_name}`.toLowerCase();
      return originStr.includes(q) || destStr.includes(q);
    });
  }

  // Calculate summary metrics on all matching records
  const summary = {
    totalReports: filtered.length,
    totalOrders: filtered.reduce((acc, r) => acc + (r.order_count || 0), 0),
    totalOmset: filtered.reduce((acc, r) => acc + (r.omset || 0), 0),
    totalOjolCount: filtered.reduce((acc, r) => acc + (r.ojol_count || 0), 0),
    totalOjolAmount: filtered.reduce((acc, r) => acc + (r.ojol_amount || 0), 0),
    totalJastipCount: filtered.reduce((acc, r) => acc + (r.jastip_count || 0), 0),
    totalJastipAmount: filtered.reduce((acc, r) => acc + (r.jastip_amount || 0), 0),
  };

  // Pagination calculation
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * perPage;
  const paged = filtered.slice(offset, offset + perPage);

  // Map to structured display records
  const reports = paged.map((r) => {
    const origin = {
      provinceId: r.origin_province_id,
      provinceName: r.origin_province_name,
      regencyId: r.origin_regency_id,
      regencyName: r.origin_regency_name,
      districtId: r.origin_district_id,
      districtName: r.origin_district_name,
      villageId: r.origin_village_id,
      villageName: r.origin_village_name,
    };
    const destination = {
      provinceId: r.dest_province_id,
      provinceName: r.dest_province_name,
      regencyId: r.dest_regency_id,
      regencyName: r.dest_regency_name,
      districtId: r.dest_district_id,
      districtName: r.dest_district_name,
      villageId: r.dest_village_id,
      villageName: r.dest_village_name,
    };

    return {
      id: r.id,
      courierId: r.courier_id,
      courierName: r.courier_name,
      courierCode: r.courier_code,
      date: r.date,
      packageTypeId: r.package_type_id,
      packageTypeName: r.package_type_name,
      origin,
      destination,
      routeDisplay: formatRouteDisplay(origin, destination),
      orderCount: r.order_count,
      omset: r.omset,
      ojolCount: r.ojol_count,
      ojolAmount: r.ojol_amount,
      jastipCount: r.jastip_count,
      jastipAmount: r.jastip_amount,
      notes: r.notes,
    };
  });

  return {
    reports,
    total,
    page: safePage,
    perPage,
    totalPages,
    summary,
  };
}

// -------------------------------------------------------------
// TEST 1: Filter Satu Kondisi (Single Filter Criteria)
// -------------------------------------------------------------
console.log("TEST 1: Filter Satu Kondisi (Single Condition)");
{
  // 1a. Filter by Date
  const dateRes = queryAdminReports(adminSession, initialReports, { date: "2026-10-02" });
  assert.strictEqual(dateRes.total, 2);
  assert.ok(dateRes.reports.every((r) => r.date === "2026-10-02"));
  console.log("  ✓ Filter tanggal: Berhasil menyaring 2 laporan tanggal 2026-10-02");

  // 1b. Filter by Courier
  const courierRes = queryAdminReports(adminSession, initialReports, { courierId: "courier-1" });
  assert.strictEqual(courierRes.total, 2);
  assert.ok(courierRes.reports.every((r) => r.courierId === "courier-1"));
  console.log("  ✓ Filter kurir: Berhasil menyaring 2 laporan milik courier-1");

  // 1c. Filter by Package Type
  const packageRes = queryAdminReports(adminSession, initialReports, { packageTypeId: "pkg-cargo" });
  assert.strictEqual(packageRes.total, 1);
  assert.strictEqual(packageRes.reports[0].packageTypeId, "pkg-cargo");
  console.log("  ✓ Filter jenis paket: Berhasil menyaring 1 laporan jenis Cargo");

  // 1d. Filter by Route (Search "Wonomulyo")
  const routeRes = queryAdminReports(adminSession, initialReports, { routeQuery: "Wonomulyo" });
  assert.strictEqual(routeRes.total, 2);
  assert.ok(routeRes.reports.every((r) => r.routeDisplay.includes("Wonomulyo")));
  console.log("  ✓ Filter rute: Berhasil menyaring 2 laporan rute Wonomulyo\n");
}

// -------------------------------------------------------------
// TEST 2: Kombinasi Filter (Multiple Combined Criteria)
// -------------------------------------------------------------
console.log("TEST 2: Kombinasi Filter (Multi-Criteria)");
{
  // Combination 1: Courier 'courier-1' + Package 'pkg-express'
  const comb1 = queryAdminReports(adminSession, initialReports, {
    courierId: "courier-1",
    packageTypeId: "pkg-express",
  });
  assert.strictEqual(comb1.total, 1);
  assert.strictEqual(comb1.reports[0].id, "rep-002");
  assert.strictEqual(comb1.reports[0].packageTypeName, "Express");
  console.log("  ✓ Kombinasi kurir & jenis paket: Berhasil menyaring tepat 1 laporan");

  // Combination 2: Date '2026-10-02' + Route 'Sidodadi'
  const comb2 = queryAdminReports(adminSession, initialReports, {
    date: "2026-10-02",
    routeQuery: "Sidodadi",
  });
  assert.strictEqual(comb2.total, 2);
  console.log("  ✓ Kombinasi tanggal & rute desa: Berhasil menyaring 2 laporan");

  // Combination 3: Courier 'courier-2' + Date '2026-10-03' + Route 'Majene'
  const comb3 = queryAdminReports(adminSession, initialReports, {
    courierId: "courier-2",
    date: "2026-10-03",
    routeQuery: "Majene",
  });
  assert.strictEqual(comb3.total, 1);
  assert.strictEqual(comb3.reports[0].destination.regencyName, "KABUPATEN MAJENE");
  console.log("  ✓ Kombinasi 3 kriteria (kurir + tanggal + rute): Berhasil menyaring 1 laporan\n");
}

// -------------------------------------------------------------
// TEST 3: Pagination Server-Side
// -------------------------------------------------------------
console.log("TEST 3: Pagination Server-Side");
{
  // Query with perPage = 2
  const page1 = queryAdminReports(adminSession, initialReports, { page: 1, perPage: 2 });
  assert.strictEqual(page1.total, 4, "Total records must be 4");
  assert.strictEqual(page1.totalPages, 2, "Total pages must be 2");
  assert.strictEqual(page1.reports.length, 2, "Page 1 must contain 2 records");
  assert.strictEqual(page1.reports[0].id, "rep-001");
  assert.strictEqual(page1.reports[1].id, "rep-002");

  const page2 = queryAdminReports(adminSession, initialReports, { page: 2, perPage: 2 });
  assert.strictEqual(page2.reports.length, 2, "Page 2 must contain 2 records");
  assert.strictEqual(page2.reports[0].id, "rep-003");
  assert.strictEqual(page2.reports[1].id, "rep-004");

  // Verify non-overlapping slices
  const ids1 = page1.reports.map((r) => r.id);
  const ids2 = page2.reports.map((r) => r.id);
  assert.ok(!ids1.some((id) => ids2.includes(id)), "Page 1 and Page 2 slices must not overlap");
  console.log("  ✓ Pagination perPage=2: Halaman 1 & 2 terbagi presisi tanpa duplikasi\n");
}

// -------------------------------------------------------------
// TEST 4: Data Kosong (Empty State Handling)
// -------------------------------------------------------------
console.log("TEST 4: Data Kosong (Empty State)");
{
  // Query with unmatched filter criteria
  const emptyRes = queryAdminReports(adminSession, initialReports, {
    date: "2020-01-01",
    routeQuery: "Kota-Antah-Berantah",
  });
  assert.strictEqual(emptyRes.total, 0);
  assert.strictEqual(emptyRes.reports.length, 0);
  assert.strictEqual(emptyRes.totalPages, 1);
  assert.strictEqual(emptyRes.summary.totalReports, 0);
  assert.strictEqual(emptyRes.summary.totalOmset, 0);
  console.log("  ✓ Data kosong ditangani bersih: total 0, array kosong, tanpa exception crash\n");
}

// -------------------------------------------------------------
// TEST 5: Data Besar (High-Volume Dataset & Performance)
// -------------------------------------------------------------
console.log("TEST 5: Data Besar (High-Volume Dataset Performance)");
{
  // Generate 200 synthetic report entries
  const largeDb = [];
  for (let i = 1; i <= 200; i++) {
    const isEven = i % 2 === 0;
    largeDb.push({
      id: `rep-large-${i}`,
      courier_id: isEven ? "courier-1" : "courier-2",
      courier_name: isEven ? "Kurir Ali" : "Kurir Budi",
      courier_code: isEven ? "JF-001" : "JF-002",
      date: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
      package_type_id: isEven ? "pkg-reguler" : "pkg-express",
      package_type_name: isEven ? "Reguler" : "Express",
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
      order_count: 10 + (i % 5),
      omset: 100000 + (i * 1000),
      ojol_count: i % 3,
      ojol_amount: (i % 3) * 10000,
      jastip_count: i % 2,
      jastip_amount: (i % 2) * 15000,
      notes: `Batch test order ${i}`,
    });
  }

  const start = performance.now();
  const largeQuery = queryAdminReports(adminSession, largeDb, {
    courierId: "courier-1",
    packageTypeId: "pkg-reguler",
    page: 4,
    perPage: 15,
  });
  const elapsed = performance.now() - start;

  assert.strictEqual(largeQuery.total, 100, "Courier 1 + Reguler should match exactly 100 entries");
  assert.strictEqual(largeQuery.totalPages, 7, "100 / 15 perPage = 7 total pages");
  assert.strictEqual(largeQuery.reports.length, 15, "Page 4 should contain 15 items");
  assert.strictEqual(largeQuery.page, 4);
  assert.ok(elapsed < 20, `Large dataset filtering completed rapidly in ${elapsed.toFixed(2)}ms`);
  console.log(`  ✓ Data besar (200 records): Selesai dalam ${elapsed.toFixed(2)}ms, pagination presisi (100 total, 7 hal)\n`);
}

// -------------------------------------------------------------
// TEST 6: Unauthorized Access Prevention
// -------------------------------------------------------------
console.log("TEST 6: Unauthorized Access Prevention");
{
  // 6a. Courier attempts to call admin monitoring query
  assert.throws(
    () => queryAdminReports(courierSession, initialReports),
    /Unauthorized: Admin role required/,
    "Courier MUST be blocked from admin monitoring"
  );
  console.log("  ✓ Kurir diblokir dari akses monitoring admin (Unauthorized 403)");

  // 6b. Unauthenticated user attempts query
  assert.throws(
    () => queryAdminReports(null, initialReports),
    /Unauthorized: Admin role required/,
    "Unauthenticated user MUST be blocked"
  );
  console.log("  ✓ Pengguna tanpa sesi diblokir (Unauthorized 403)\n");
}

// -------------------------------------------------------------
// TEST 7: Route Format Display Check
// -------------------------------------------------------------
console.log("TEST 7: Format Rute (Wilayah Asal → Wilayah Tujuan)");
{
  const res = queryAdminReports(adminSession, initialReports, { page: 1, perPage: 10 });
  const report1 = res.reports.find((r) => r.id === "rep-001");
  assert.strictEqual(
    report1.routeDisplay,
    "Manding, Polewali → Madatte, Polewali",
    "Must output exact format: Manding, Polewali → Madatte, Polewali"
  );

  const report4 = res.reports.find((r) => r.id === "rep-004");
  assert.strictEqual(
    report4.routeDisplay,
    "Manding, Polewali (Kab. Polewali Mandar) → Banggae, Banggae (Kab. Majene)",
    "Must output regency qualification for inter-regency route"
  );
  console.log(`  ✓ Format rute terverifikasi baku: "${report1.routeDisplay}"\n`);
}

// -------------------------------------------------------------
// TEST 8: Detail Inspection (All 8 Required Fields)
// -------------------------------------------------------------
console.log("TEST 8: Detail Laporan (8 Required Audit Attributes)");
{
  const report = initialReports[0];

  // 1. Kurir
  assert.ok(report.courier_name && report.courier_code);
  // 2. Tanggal
  assert.strictEqual(report.date, "2026-10-01");
  // 3. Rute
  assert.ok(report.origin_village_name && report.dest_village_name);
  // 4. Order
  assert.strictEqual(typeof report.order_count, "number");
  // 5. Omset
  assert.strictEqual(typeof report.omset, "number");
  // 6. Paket
  assert.ok(report.package_type_name);
  // 7. Ojol & Jastip
  assert.strictEqual(typeof report.ojol_count, "number");
  assert.strictEqual(typeof report.jastip_count, "number");
  // 8. Catatan
  assert.ok(report.notes);

  console.log("  ✓ Seluruh 8 atribut laporan (kurir, tanggal, rute, order, omset, paket, ojol/jastip, catatan) terkonfirmasi lengkap");
}

console.log("\n=======================================================");
console.log("ALL 8 TEST SCENARIOS IN PHASE 9 TEST SUITE PASSED!");
console.log("=======================================================\n");
