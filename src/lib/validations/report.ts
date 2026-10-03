/**
 * Daily Operational Report Validation
 * Enforces business rules & input security:
 * - Departure and Destination cannot be identical
 * - Numbers must be finite, non-negative, and within PostgreSQL column bounds
 * - Counts must be integers
 * - Date must be valid YYYY-MM-DD
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

const MAX_COUNT_VALUE = 100000;
const MAX_CURRENCY_VALUE = 9999999999.99; // Matches numeric(12, 2)
const MAX_NOTES_LENGTH = 1000;

function isValidCount(val: unknown): val is number {
  return (
    typeof val === "number" &&
    Number.isFinite(val) &&
    Number.isInteger(val) &&
    val >= 0 &&
    val <= MAX_COUNT_VALUE
  );
}

function isValidCurrency(val: unknown): val is number {
  return (
    typeof val === "number" &&
    Number.isFinite(val) &&
    val >= 0 &&
    val <= MAX_CURRENCY_VALUE
  );
}

export function validateDailyReportInput(input: DailyReportInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: { form: "Payload laporan tidak valid" } };
  }

  if (!input.courierId || typeof input.courierId !== "string" || !input.courierId.trim()) {
    errors.courierId = "Kurir wajib diisi";
  }

  if (!input.date || typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Tanggal operasional wajib berformat YYYY-MM-DD";
  }

  if (!input.packageTypeId || typeof input.packageTypeId !== "string" || !input.packageTypeId.trim()) {
    errors.packageTypeId = "Jenis paket wajib dipilih";
  }

  // Origin region validation
  if (
    !input.origin?.provinceId ||
    !input.origin?.regencyId ||
    !input.origin?.districtId ||
    !input.origin?.villageId
  ) {
    errors.origin =
      "Wilayah keberangkatan harus dipilih lengkap (Provinsi, Kab/Kota, Kec, Desa/Kel)";
  }

  // Destination region validation
  if (
    !input.destination?.provinceId ||
    !input.destination?.regencyId ||
    !input.destination?.districtId ||
    !input.destination?.villageId
  ) {
    errors.destination =
      "Wilayah tujuan harus dipilih lengkap (Provinsi, Kab/Kota, Kec, Desa/Kel)";
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
  if (!isValidCount(input.orderCount)) {
    errors.orderCount =
      "Jumlah order harus berupa bilangan bulat valid dan tidak boleh negatif";
  }

  if (!isValidCurrency(input.omset)) {
    errors.omset =
      "Omset harus berupa nilai uang numerik valid dan tidak boleh negatif";
  }

  if (!isValidCount(input.ojolCount)) {
    errors.ojolCount =
      "Jumlah ojol harus berupa bilangan bulat valid dan tidak boleh negatif";
  }

  if (!isValidCurrency(input.ojolAmount)) {
    errors.ojolAmount =
      "Nominal ojol harus berupa nilai valid dan tidak boleh negatif";
  }

  if (!isValidCount(input.jastipCount)) {
    errors.jastipCount =
      "Jumlah jastip harus berupa bilangan bulat valid dan tidak boleh negatif";
  }

  if (!isValidCurrency(input.jastipAmount)) {
    errors.jastipAmount =
      "Nominal jastip harus berupa nilai valid dan tidak boleh negatif";
  }

  if (input.notes !== undefined && input.notes !== null) {
    if (typeof input.notes !== "string" || input.notes.length > MAX_NOTES_LENGTH) {
      errors.notes = `Catatan maksimal ${MAX_NOTES_LENGTH} karakter`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
