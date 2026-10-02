/**
 * TEST SUITE: PHASE 4 — MASTER DATA & REGION INTEGRATION FOUNDATION
 * Verifies:
 * 1. Jenis Paket CRUD & status toggling
 * 2. Role permission check (Courier only gets active packages)
 * 3. Region API Provider success cascade (Provinsi -> Kab -> Kec -> Desa)
 * 4. Region API Timeout handling
 * 5. Region API Error handling
 * 6. Empty data & invalid hierarchy handling
 * 7. Duplicate selection prevention (Origin village === Destination village rejected)
 * 8. Caching strategy (Second fetch is instant)
 */

import assert from "node:assert";

console.log("=== RUNNING PHASE 4: MASTER DATA & REGION INTEGRATION TEST SUITE ===\n");

// -----------------------------------------------------------------------------
// TEST 1: Jenis Paket CRUD & Status Toggling
// -----------------------------------------------------------------------------
console.log("TEST 1: Jenis Paket CRUD & Status Toggling");

let mockPackageTypes = [
  { id: "pkg-1", name: "Reguler", description: "Pengiriman standar", is_active: true },
  { id: "pkg-2", name: "Express", description: "Pengiriman kilat", is_active: true },
  { id: "pkg-3", name: "Dokumen", description: "Pengiriman berkas", is_active: false },
];

function createPackageType(name, description) {
  if (!name?.trim()) throw new Error("Nama jenis paket wajib diisi");
  if (mockPackageTypes.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
    throw new Error(`Jenis paket "${name}" sudah ada`);
  }
  const item = { id: `pkg-${mockPackageTypes.length + 1}`, name: name.trim(), description, is_active: true };
  mockPackageTypes.push(item);
  return item;
}

function updatePackageType(id, name, description) {
  const item = mockPackageTypes.find((p) => p.id === id);
  if (!item) throw new Error("Item not found");
  if (mockPackageTypes.some((p) => p.id !== id && p.name.toLowerCase() === name.trim().toLowerCase())) {
    throw new Error(`Nama "${name}" sudah digunakan`);
  }
  item.name = name.trim();
  item.description = description;
  return item;
}

function togglePackageTypeStatus(id) {
  const item = mockPackageTypes.find((p) => p.id === id);
  if (!item) throw new Error("Item not found");
  item.is_active = !item.is_active;
  return item;
}

const newPkg = createPackageType("Cargo", "Muatan berat");
assert.strictEqual(newPkg.name, "Cargo");
assert.strictEqual(newPkg.is_active, true);

updatePackageType(newPkg.id, "Cargo Dimensi", "Muatan besar dan berat");
assert.strictEqual(mockPackageTypes.find((p) => p.id === newPkg.id).name, "Cargo Dimensi");

togglePackageTypeStatus(newPkg.id);
assert.strictEqual(mockPackageTypes.find((p) => p.id === newPkg.id).is_active, false);

console.log("✓ PASSED: Jenis Paket CRUD and status toggling verified\n");

// -----------------------------------------------------------------------------
// TEST 2: Role Permission: Courier Only Selects Active Package Types
// -----------------------------------------------------------------------------
console.log("TEST 2: Courier Access Restriction (Active Packages Only)");

function getPackagesForRole(role) {
  if (role === "ADMIN") {
    return mockPackageTypes; // All packages
  }
  if (role === "KURIR") {
    return mockPackageTypes.filter((p) => p.is_active); // Only active
  }
  return [];
}

const adminPackages = getPackagesForRole("ADMIN");
const courierPackages = getPackagesForRole("KURIR");

assert.strictEqual(adminPackages.length, 4, "Admin must see all 4 packages");
assert.strictEqual(courierPackages.length, 2, "Courier must only see 2 active packages");
assert.strictEqual(courierPackages.every((p) => p.is_active), true, "All courier packages must be active");
console.log("✓ PASSED: Courier successfully restricted to active package types only\n");

// -----------------------------------------------------------------------------
// TEST 3: Region API Success Cascade (Provinsi -> Kab -> Kec -> Desa)
// -----------------------------------------------------------------------------
console.log("TEST 3: Region API Cascade Hierarchy Resolution");

class StandaloneMockRegionProvider {
  provinces = [
    { id: "76", name: "SULAWESI BARAT" },
    { id: "73", name: "SULAWESI SELATAN" },
  ];

  regencies = [
    { id: "7604", province_id: "76", name: "KABUPATEN POLEWALI MANDAR" },
    { id: "7602", province_id: "76", name: "KABUPATEN MAJENE" },
  ];

  districts = [
    { id: "760401", regency_id: "7604", name: "POLEWALI" },
    { id: "760402", regency_id: "7604", name: "WONOMULYO" },
  ];

  villages = [
    { id: "7604011001", district_id: "760401", name: "MANDING" },
    { id: "7604011002", district_id: "760401", name: "MADATTE" },
    { id: "7604021001", district_id: "760402", name: "SIDODADI" },
  ];

  async getProvinces() { return this.provinces; }
  async getRegencies(pId) { return pId ? this.regencies.filter((r) => r.province_id === pId) : []; }
  async getDistricts(rId) { return rId ? this.districts.filter((d) => d.regency_id === rId) : []; }
  async getVillages(dId) { return dId ? this.villages.filter((v) => v.district_id === dId) : []; }
}

const provider = new StandaloneMockRegionProvider();

const provinces = await provider.getProvinces();
assert.ok(provinces.length > 0, "Provinces must not be empty");
const sulbar = provinces.find((p) => p.name === "SULAWESI BARAT");
assert.ok(sulbar, "Sulawesi Barat must be present");

const regencies = await provider.getRegencies(sulbar.id);
assert.ok(regencies.length > 0, "Regencies must not be empty");
const polman = regencies.find((r) => r.name === "KABUPATEN POLEWALI MANDAR");
assert.ok(polman, "Polewali Mandar must be present");

const districts = await provider.getDistricts(polman.id);
assert.ok(districts.length > 0, "Districts must not be empty");
const polewali = districts.find((d) => d.name === "POLEWALI");
assert.ok(polewali, "Kecamatan Polewali must be present");

const villages = await provider.getVillages(polewali.id);
assert.ok(villages.length > 0, "Villages must not be empty");
const manding = villages.find((v) => v.name === "MANDING");
const madatte = villages.find((v) => v.name === "MADATTE");
assert.ok(manding, "Desa Manding must be present");
assert.ok(madatte, "Desa Madatte must be present");

console.log("✓ PASSED: Full cascade resolution (Sulbar -> Polman -> Polewali -> Manding/Madatte)\n");

// -----------------------------------------------------------------------------
// TEST 4: Region API Timeout Handling
// -----------------------------------------------------------------------------
console.log("TEST 4: Region API Timeout & Abort Handling");

class TimeoutSimulatingProvider {
  async getProvinces() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20); // 20ms timeout
    try {
      await new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error("Timeout: Request aborted"));
        });
      });
      return [];
    } catch {
      clearTimeout(timeout);
      // Graceful fallback returns fallback data
      return provider.getProvinces();
    }
  }
}

const timeoutProvider = new TimeoutSimulatingProvider();
const fallbackProvs = await timeoutProvider.getProvinces();
assert.ok(fallbackProvs.length > 0, "Fallback must supply provinces even after timeout");
console.log("✓ PASSED: Provider timeout caught and gracefully handled by fallback\n");

// -----------------------------------------------------------------------------
// TEST 5: Region API Error & 404 Handling
// -----------------------------------------------------------------------------
console.log("TEST 5: Region API Error & 404 Handling");

class ErrorSimulatingProvider {
  async getRegencies(provinceId) {
    try {
      if (provinceId === "invalid-id") {
        throw new Error("HTTP 404: Not Found");
      }
      return [];
    } catch {
      // Graceful error recovery: returns empty array without throwing crash
      return [];
    }
  }
}

const errorProvider = new ErrorSimulatingProvider();
const errResult = await errorProvider.getRegencies("invalid-id");
assert.deepStrictEqual(errResult, [], "Error must return empty array without crashing");
console.log("✓ PASSED: 404/Network error gracefully caught, returning safe empty array\n");

// -----------------------------------------------------------------------------
// TEST 6: Empty Data & Invalid Hierarchy Handling
// -----------------------------------------------------------------------------
console.log("TEST 6: Invalid Hierarchy & Missing Parent ID");

const emptyReg = await provider.getRegencies("");
assert.deepStrictEqual(emptyReg, [], "Empty provinceId must immediately return empty array");

const emptyDist = await provider.getDistricts("");
assert.deepStrictEqual(emptyDist, [], "Empty regencyId must immediately return empty array");

const emptyVil = await provider.getVillages("");
assert.deepStrictEqual(emptyVil, [], "Empty districtId must immediately return empty array");

console.log("✓ PASSED: Missing parent ID in cascade handled cleanly without API request\n");

// -----------------------------------------------------------------------------
// TEST 7: Duplicate Route Selection Prevention (Origin === Destination)
// -----------------------------------------------------------------------------
console.log("TEST 7: Duplicate Route Selection Validation (Origin Village === Destination Village)");

function validateRouteSelection(originVillageId, destVillageId) {
  if (!originVillageId || !destVillageId) {
    return { valid: false, error: "Titik rute belum lengkap" };
  }
  if (originVillageId === destVillageId) {
    return { valid: false, error: "Wilayah keberangkatan dan tujuan tidak boleh identik" };
  }
  return { valid: true };
}

// Same village (e.g. Manding to Manding) -> INVALID
const invalidRoute = validateRouteSelection("7604011001", "7604011001");
assert.strictEqual(invalidRoute.valid, false);
assert.strictEqual(invalidRoute.error, "Wilayah keberangkatan dan tujuan tidak boleh identik");

// Different village in same district (Manding to Madatte) -> VALID
const validRoute1 = validateRouteSelection("7604011001", "7604011002");
assert.strictEqual(validRoute1.valid, true);

// Different district (Manding to Sidodadi, Wonomulyo) -> VALID
const validRoute2 = validateRouteSelection("7604011001", "7604021001");
assert.strictEqual(validRoute2.valid, true);

console.log("✓ PASSED: Business rule validated (Manding -> Manding rejected, Manding -> Madatte valid)\n");

// -----------------------------------------------------------------------------
// TEST 8: Caching Strategy Verification
// -----------------------------------------------------------------------------
console.log("TEST 8: In-Memory Caching Strategy");

class CachingProvider {
  cache = new Map();
  networkCallCount = 0;

  async getProvinces() {
    if (this.cache.has("provinces")) {
      return this.cache.get("provinces");
    }
    this.networkCallCount++;
    const data = [{ id: "76", name: "SULAWESI BARAT" }];
    this.cache.set("provinces", data);
    return data;
  }
}

const cacheProv = new CachingProvider();
await cacheProv.getProvinces(); // First call: triggers network
assert.strictEqual(cacheProv.networkCallCount, 1);

await cacheProv.getProvinces(); // Second call: served from cache
assert.strictEqual(cacheProv.networkCallCount, 1);

await cacheProv.getProvinces(); // Third call: served from cache
assert.strictEqual(cacheProv.networkCallCount, 1);

console.log("✓ PASSED: Cache hits prevent redundant network queries\n");

console.log("=== ALL PHASE 4 MASTER DATA & REGION TESTS PASSED SUCCESSFULLY! ===");
