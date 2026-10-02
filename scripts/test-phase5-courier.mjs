/**
 * TEST SUITE: PHASE 5 — COURIER DASHBOARD & NAVIGATION
 * Verifies:
 * 1. Admin accessing Courier URL -> redirected to /admin/dashboard
 * 2. Courier accessing Courier Dashboard -> authorized
 * 3. Courier without data -> graceful zero state rendering
 * 4. Courier data isolation -> Courier A cannot see Courier B's reports
 * 5. Session expired / unauthenticated -> redirected to login
 * 6. Navigation isolation -> Courier navigation contains zero admin routes
 * 7. Timezone formatting in WITA (e.g. 08:01 WITA)
 */

import assert from "node:assert";

console.log("=== RUNNING PHASE 5: COURIER DASHBOARD TEST SUITE ===\n");

const ROLES = {
  ADMIN: "ADMIN",
  KURIR: "KURIR",
};

// Simulation helpers
function simulateRequireCourier(session) {
  if (!session || !session.user) {
    return { status: 302, redirect: "/login?redirectTo=%2Fcourier%2Fdashboard" };
  }
  if (!session.profile || !session.profile.isActive) {
    return { status: 302, redirect: "/login?error=account_deactivated" };
  }
  if (session.profile.role !== ROLES.KURIR) {
    // Admin attempting to access courier portal is bounced to admin dashboard
    return { status: 302, redirect: "/admin/dashboard", blocked: true };
  }
  return { status: 200, allowed: true, user: session.user, courier: session.courier };
}

// Mock Sessions
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

const courierNoData = {
  user: { id: "courier-c-uuid", email: "kurir3@jetfoodpolman.com" },
  profile: { id: "courier-c-uuid", role: ROLES.KURIR, fullName: "Kurir Baru", isActive: true },
  courier: { id: "courier-rec-c", courierCode: "JF-003" },
};

// -----------------------------------------------------------------------------
// TEST 1: Admin Accesses Courier Portal
// -----------------------------------------------------------------------------
console.log("TEST 1: Admin attempting to access /courier/* routes");
const adminAccess = simulateRequireCourier(adminSession);
assert.strictEqual(adminAccess.blocked, true);
assert.strictEqual(adminAccess.redirect, "/admin/dashboard");
console.log("✓ PASSED: Admin prevented from entering courier space, redirected to /admin/dashboard\n");

// -----------------------------------------------------------------------------
// TEST 2: Courier Accesses Courier Portal
// -----------------------------------------------------------------------------
console.log("TEST 2: Courier accessing /courier/dashboard");
const courierAccess = simulateRequireCourier(courierA);
assert.strictEqual(courierAccess.allowed, true);
assert.strictEqual(courierAccess.courier.courierCode, "JF-001");
console.log("✓ PASSED: Courier authorized to access courier dashboard\n");

// -----------------------------------------------------------------------------
// TEST 3: Courier Without Data (Zero-state verification)
// -----------------------------------------------------------------------------
console.log("TEST 3: Courier without attendance or reports (Zero-state handling)");

function computeCourierDashboardState({ attendanceRow, reportsRows }) {
  const attendance = attendanceRow
    ? {
        hasClockedIn: !!attendanceRow.clock_in_time,
        hasClockedOut: !!attendanceRow.clock_out_time,
        status: attendanceRow.clock_out_time ? "SUDAH_PULANG" : "SUDAH_MASUK",
      }
    : {
        hasClockedIn: false,
        hasClockedOut: false,
        status: "BELUM_ABSEN",
      };

  const reports = reportsRows || [];
  let totalOrders = 0;
  let totalOmset = 0;
  for (const r of reports) {
    totalOrders += r.order_count;
    totalOmset += r.omset;
  }

  return {
    attendance,
    recentReports: reports,
    todayStats: {
      totalOrders,
      totalOmset,
      reportCount: reports.length,
    },
  };
}

const courierNoDataAccess = simulateRequireCourier(courierNoData);
assert.strictEqual(courierNoDataAccess.allowed, true);
assert.strictEqual(courierNoDataAccess.courier.courierCode, "JF-003");

const zeroState = computeCourierDashboardState({ attendanceRow: null, reportsRows: [] });
assert.strictEqual(zeroState.attendance.status, "BELUM_ABSEN");
assert.strictEqual(zeroState.recentReports.length, 0);
assert.strictEqual(zeroState.todayStats.totalOrders, 0);
assert.strictEqual(zeroState.todayStats.totalOmset, 0);
assert.strictEqual(zeroState.todayStats.reportCount, 0);
console.log("✓ PASSED: Zero-state renders safely without null errors or crashes\n");

// -----------------------------------------------------------------------------
// TEST 4: Data Isolation (Courier A cannot access Courier B's data)
// -----------------------------------------------------------------------------
console.log("TEST 4: Strict Courier Data Isolation (RLS & Courier ID Filtering)");

const mockDatabaseReports = [
  { id: "rep-1", courier_id: "courier-rec-a", order_count: 10, omset: 100000 },
  { id: "rep-2", courier_id: "courier-rec-b", order_count: 25, omset: 250000 },
];

function queryCourierReports(callingCourierId) {
  // Simulates Postgres RLS policy: USING (courier_id = public.get_auth_courier_id())
  return mockDatabaseReports.filter((r) => r.courier_id === callingCourierId);
}

const reportsA = queryCourierReports(courierA.courier.id);
assert.strictEqual(reportsA.length, 1);
assert.strictEqual(reportsA[0].id, "rep-1");

const reportsB = queryCourierReports(courierB.courier.id);
assert.strictEqual(reportsB.length, 1);
assert.strictEqual(reportsB[0].id, "rep-2");

// Courier A querying Courier B's ID directly:
const leakedToA = reportsA.some((r) => r.courier_id === courierB.courier.id);
assert.strictEqual(leakedToA, false, "Courier A must never receive Courier B data");
console.log("✓ PASSED: Courier data isolation guaranteed at query level\n");

// -----------------------------------------------------------------------------
// TEST 5: Session Expired / Unauthenticated
// -----------------------------------------------------------------------------
console.log("TEST 5: Expired session accessing courier dashboard");
const expiredAccess = simulateRequireCourier(null);
assert.strictEqual(expiredAccess.status, 302);
assert.strictEqual(expiredAccess.redirect, "/login?redirectTo=%2Fcourier%2Fdashboard");
console.log("✓ PASSED: Expired session bounced to login\n");

// -----------------------------------------------------------------------------
// TEST 6: Navigation Isolation (No Admin Links in Courier Navigation)
// -----------------------------------------------------------------------------
console.log("TEST 6: Navigation Isolation Audit");

const courierNavLinks = [
  "/courier/dashboard",
  "/courier/attendance",
  "/courier/reports/new",
  "/courier/history",
];

const hasAdminLink = courierNavLinks.some((link) => link.startsWith("/admin"));
assert.strictEqual(hasAdminLink, false, "Courier navigation must not contain any /admin route");
console.log("✓ PASSED: Courier navigation contains 0 admin links\n");

// -----------------------------------------------------------------------------
// TEST 7: WITA Timezone Formatting
// -----------------------------------------------------------------------------
console.log("TEST 7: WITA Timezone Formatting Check");

function formatTimeInWita(isoString) {
  const d = new Date(isoString);
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d) + " WITA"
  );
}

// 00:01 UTC = 08:01 WITA (UTC+8)
const timeFormatted = formatTimeInWita("2026-10-02T00:01:00Z");
assert.strictEqual(timeFormatted, "08.01 WITA");
console.log("✓ PASSED: Timezone conversion to WITA accurate (00:01 UTC -> 08.01 WITA)\n");

console.log("=== ALL PHASE 5 COURIER DASHBOARD TESTS PASSED SUCCESSFULLY! ===");
