"use server";

import { regionService } from "@/lib/region";
import { Province, Regency, District, Village, RegionConnectionResult } from "@/lib/region/types";

/**
 * Fetch all Indonesian provinces
 */
export async function getProvinces(): Promise<Province[]> {
  try {
    return await regionService.getProvinces();
  } catch (error) {
    console.error("Error in getProvinces action:", error);
    return [];
  }
}

/**
 * Fetch regencies / cities under specified province
 */
export async function getRegencies(provinceId: string): Promise<Regency[]> {
  if (!provinceId) return [];
  try {
    return await regionService.getRegencies(provinceId);
  } catch (error) {
    console.error(`Error in getRegencies(${provinceId}) action:`, error);
    return [];
  }
}

/**
 * Fetch subdistricts (kecamatan) under specified regency
 */
export async function getDistricts(regencyId: string): Promise<District[]> {
  if (!regencyId) return [];
  try {
    return await regionService.getDistricts(regencyId);
  } catch (error) {
    console.error(`Error in getDistricts(${regencyId}) action:`, error);
    return [];
  }
}

/**
 * Fetch villages / urban wards (kelurahan/desa) under specified district
 */
export async function getVillages(districtId: string): Promise<Village[]> {
  if (!districtId) return [];
  try {
    return await regionService.getVillages(districtId);
  } catch (error) {
    console.error(`Error in getVillages(${districtId}) action:`, error);
    return [];
  }
}

/**
 * Test connectivity and latency with Region API provider (Admin only)
 */
export async function testRegionConnectionAction(): Promise<RegionConnectionResult> {
  return await regionService.testConnection();
}

/**
 * Get active region provider configuration
 */
export async function getRegionProviderInfoAction() {
  return regionService.getProviderInfo();
}
