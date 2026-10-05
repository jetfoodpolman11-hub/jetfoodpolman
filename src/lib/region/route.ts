import { RegionSelection } from "@/lib/validations/report";

export interface RouteValidationResult {
  isValid: boolean;
  error?: string;
  isSameDistrict: boolean;
  isIdentical: boolean;
}

/**
 * Validates Indonesian regional code formatting and hierarchical prefix
 */
export function validateRegionId(
  id: string,
  type: "province" | "regency" | "district" | "village",
  parentId?: string
): boolean {
  if (!id || typeof id !== "string") return false;

  const trimmed = id.trim();
  // Must consist only of numbers
  if (!/^\d+$/.test(trimmed)) return false;

  switch (type) {
    case "province":
      // Indonesian province IDs are 2 digits (e.g. 76 for Sulbar)
      return trimmed.length === 2;

    case "regency":
      // Regency IDs are 4 digits, starting with province ID (e.g. 7604)
      if (trimmed.length !== 4) return false;
      if (parentId && !trimmed.startsWith(parentId)) return false;
      return true;

    case "district":
      // District IDs are 6 to 7 digits, starting with regency ID (e.g. 760401)
      if (trimmed.length < 6 || trimmed.length > 7) return false;
      if (parentId && !trimmed.startsWith(parentId)) return false;
      return true;

    case "village":
      // Village IDs are 10 digits, starting with district ID (e.g. 7604011001)
      if (trimmed.length !== 10) return false;
      if (parentId && !trimmed.startsWith(parentId)) return false;
      return true;

    default:
      return false;
  }
}

/**
 * Format title case for clean route presentation (e.g. "MANDING" -> "Manding")
 */
export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats standard operational route display string.
 * Example requirement:
 * Departure: Manding, Polewali
 * Destination: Madatte, Polewali
 * Output: "Manding, Polewali → Madatte, Polewali"
 */
export function formatRouteDisplay(
  origin: RegionSelection,
  destination: RegionSelection
): string {
  const originVil = toTitleCase(origin.villageName);
  const originDist = toTitleCase(origin.districtName);
  const destVil = toTitleCase(destination.villageName);
  const destDist = toTitleCase(destination.districtName);

  // If in different regencies, include regency name for clarity
  if (origin.regencyId !== destination.regencyId) {
    const originReg = toTitleCase(
      origin.regencyName.replace(/^KABUPATEN\s+/i, "Kab. ").replace(/^KOTA\s+/i, "Kota ")
    );
    const destReg = toTitleCase(
      destination.regencyName.replace(/^KABUPATEN\s+/i, "Kab. ").replace(/^KOTA\s+/i, "Kota ")
    );
    return `${originVil}, ${originDist} (${originReg}) → ${destVil}, ${destDist} (${destReg})`;
  }

  // Same regency (standard in Polman)
  return `${originVil}, ${originDist} → ${destVil}, ${destDist}`;
}

/**
 * Validates route selection according to operational business rules:
 * - Departure and destination must be fully selected (Province -> Regency -> District -> Village).
 * - Routes within the SAME village/kelurahan or SAME district are completely VALID
 *   (e.g. Manding -> Manding or Manding -> Madatte in Polewali).
 * - Regional IDs must be valid Indonesian codes following the hierarchy.
 */
export function validateRouteSelection(
  origin: RegionSelection | null,
  destination: RegionSelection | null
): RouteValidationResult {
  if (!origin || !destination) {
    return {
      isValid: false,
      error: "Wilayah keberangkatan dan tujuan harus dipilih lengkap.",
      isSameDistrict: false,
      isIdentical: false,
    };
  }

  // 1. Completeness Check
  if (
    !origin.provinceId ||
    !origin.provinceName ||
    !origin.regencyId ||
    !origin.regencyName ||
    !origin.districtId ||
    !origin.districtName ||
    !origin.villageId ||
    !origin.villageName
  ) {
    return {
      isValid: false,
      error: "Wilayah keberangkatan harus dipilih lengkap hingga tingkat desa/kelurahan.",
      isSameDistrict: false,
      isIdentical: false,
    };
  }

  if (
    !destination.provinceId ||
    !destination.provinceName ||
    !destination.regencyId ||
    !destination.regencyName ||
    !destination.districtId ||
    !destination.districtName ||
    !destination.villageId ||
    !destination.villageName
  ) {
    return {
      isValid: false,
      error: "Wilayah tujuan harus dipilih lengkap hingga tingkat desa/kelurahan.",
      isSameDistrict: false,
      isIdentical: false,
    };
  }

  // 2. Format & Hierarchy Check on Origin IDs
  if (!validateRegionId(origin.provinceId, "province")) {
    return {
      isValid: false,
      error: `ID Provinsi keberangkatan tidak valid: ${origin.provinceId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(origin.regencyId, "regency", origin.provinceId)) {
    return {
      isValid: false,
      error: `ID Kabupaten/Kota keberangkatan tidak valid atau tidak sesuai provinsi: ${origin.regencyId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(origin.districtId, "district", origin.regencyId)) {
    return {
      isValid: false,
      error: `ID Kecamatan keberangkatan tidak valid atau tidak sesuai kab/kota: ${origin.districtId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(origin.villageId, "village", origin.districtId)) {
    return {
      isValid: false,
      error: `ID Desa/Kelurahan keberangkatan tidak valid atau tidak sesuai kecamatan: ${origin.villageId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }

  // 3. Format & Hierarchy Check on Destination IDs
  if (!validateRegionId(destination.provinceId, "province")) {
    return {
      isValid: false,
      error: `ID Provinsi tujuan tidak valid: ${destination.provinceId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(destination.regencyId, "regency", destination.provinceId)) {
    return {
      isValid: false,
      error: `ID Kabupaten/Kota tujuan tidak valid atau tidak sesuai provinsi: ${destination.regencyId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(destination.districtId, "district", destination.regencyId)) {
    return {
      isValid: false,
      error: `ID Kecamatan tujuan tidak valid atau tidak sesuai kab/kota: ${destination.districtId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }
  if (!validateRegionId(destination.villageId, "village", destination.districtId)) {
    return {
      isValid: false,
      error: `ID Desa/Kelurahan tujuan tidak valid atau tidak sesuai kecamatan: ${destination.villageId}`,
      isSameDistrict: false,
      isIdentical: false,
    };
  }

  // 4. Same Village & Same District Evaluation (Both are valid operational routes!)
  const isIdentical = origin.villageId === destination.villageId;
  const isSameDistrict = origin.districtId === destination.districtId;

  return {
    isValid: true,
    isSameDistrict,
    isIdentical,
  };
}
