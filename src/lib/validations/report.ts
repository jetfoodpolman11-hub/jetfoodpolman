/**
 * Daily Operational Report Validation
 * Enforces business rules:
 * - Departure and Destination cannot be identical
 * - Numbers cannot be negative
 * - Package type must be valid
 */

export interface RegionSelection {
  provinceId: string;
  provinceName: string;
  regencyId: string;
  regencyName: string;
  districtId: string;
  districtName: string;
  villageId: string;
  villageName: string;
}

export interface DailyReportInput {
  courierId: string;
  date: string; // YYYY-MM-DD
  packageTypeId: string;
  origin: RegionSelection;
  destination: RegionSelection;
  orderCount: number;
  omset: number;
  ojolCount: number;
  ojolAmount: number;
  jastipCount: number;
  jastipAmount: number;
  notes?: string;
}

export function validateDailyReportInput(input: DailyReportInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.courierId) {
    errors.courierId = "Kurir wajib diisi";
  }

  if (!input.date) {
    errors.date = "Tanggal operasional wajib diisi";
  }

  if (!input.packageTypeId) {
    errors.packageTypeId = "Jenis paket wajib dipilih";
  }

  // Origin region validation
  if (!input.origin?.provinceId || !input.origin?.regencyId || !input.origin?.districtId || !input.origin?.villageId) {
    errors.origin = "Wilayah keberangkatan harus dipilih lengkap (Provinsi, Kab/Kota, Kec, Desa/Kel)";
  }

  // Destination region validation
  if (!input.destination?.provinceId || !input.destination?.regencyId || !input.destination?.districtId || !input.destination?.villageId) {
    errors.destination = "Wilayah tujuan harus dipilih lengkap (Provinsi, Kab/Kota, Kec, Desa/Kel)";
  }

  // Business rule: Origin and Destination must not be identical at the lowest level
  if (
    input.origin?.villageId &&
    input.destination?.villageId &&
    input.origin.villageId === input.destination.villageId
  ) {
    errors.route = "Wilayah keberangkatan dan tujuan tidak boleh identik";
  }

  // Numeric metrics validation
  if (typeof input.orderCount !== "number" || Number.isNaN(input.orderCount) || input.orderCount < 0) {
    errors.orderCount = "Jumlah order harus berupa angka valid dan tidak boleh negatif";
  }

  if (typeof input.omset !== "number" || Number.isNaN(input.omset) || input.omset < 0) {
    errors.omset = "Omset harus berupa nilai uang numerik valid dan tidak boleh negatif";
  }

  if (typeof input.ojolCount !== "number" || Number.isNaN(input.ojolCount) || input.ojolCount < 0) {
    errors.ojolCount = "Jumlah ojol harus berupa angka valid dan tidak boleh negatif";
  }

  if (typeof input.ojolAmount !== "number" || Number.isNaN(input.ojolAmount) || input.ojolAmount < 0) {
    errors.ojolAmount = "Nominal ojol harus berupa nilai valid dan tidak boleh negatif";
  }

  if (typeof input.jastipCount !== "number" || Number.isNaN(input.jastipCount) || input.jastipCount < 0) {
    errors.jastipCount = "Jumlah jastip harus berupa angka valid dan tidak boleh negatif";
  }

  if (typeof input.jastipAmount !== "number" || Number.isNaN(input.jastipAmount) || input.jastipAmount < 0) {
    errors.jastipAmount = "Nominal jastip harus berupa nilai valid dan tidak boleh negatif";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
