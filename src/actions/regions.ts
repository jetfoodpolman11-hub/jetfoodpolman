"use server";

import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { regionService } from "@/lib/region";
import { Province, Regency, District, Village, RegionConnectionResult } from "@/lib/region/types";

function isValidNumericRegionCode(id: string, minLen = 2, maxLen = 10): boolean {
  if (!id || typeof id !== "string") return false;
  const trimmed = id.trim();
  return new RegExp(`^\\d{${minLen},${maxLen}}$`).test(trimmed);
}

/**
 * Fetch all Indonesian provinces (Authenticated users only)
 */
export async function getProvinces(): Promise<Province[]> {
  await requireAuth();
  try {
    return await regionService.getProvinces();
  } catch (error) {
    console.error("Error in getProvinces action:", error);
    return [];
  }
}

/**
 * Fetch regencies / cities under specified province (Authenticated users only)
 */
export async function getRegencies(provinceId: string): Promise<Regency[]> {
  await requireAuth();
  if (!isValidNumericRegionCode(provinceId, 2, 2)) return [];
  try {
    return await regionService.getRegencies(provinceId.trim());
  } catch (error) {
    console.error(`Error in getRegencies(${provinceId}) action:`, error);
    return [];
  }
}

/**
 * Fetch subdistricts (kecamatan) under specified regency (Authenticated users only)
 */
export async function getDistricts(regencyId: string): Promise<District[]> {
  await requireAuth();
  if (!isValidNumericRegionCode(regencyId, 4, 4)) return [];
  try {
    return await regionService.getDistricts(regencyId.trim());
  } catch (error) {
    console.error(`Error in getDistricts(${regencyId}) action:`, error);
    return [];
  }
}

/**
 * Fetch villages / urban wards (kelurahan/desa) under specified district (Authenticated users only)
 */
export async function getVillages(districtId: string): Promise<Village[]> {
  await requireAuth();
  if (!isValidNumericRegionCode(districtId, 6, 7)) return [];
  try {
    return await regionService.getVillages(districtId.trim());
  } catch (error) {
    console.error(`Error in getVillages(${districtId}) action:`, error);
    return [];
  }
}

/**
 * Test connectivity and latency with Region API provider (Admin only)
 */
export async function testRegionConnectionAction(): Promise<RegionConnectionResult> {
  await requireAdmin();
  return await regionService.testConnection();
}

/**
 * Get active region provider configuration (Admin only)
 */
export async function getRegionProviderInfoAction() {
  await requireAdmin();
  return regionService.getProviderInfo();
}
