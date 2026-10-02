/**
 * Region Integration Types & Interface Abstraction
 * Allows pluggable Indonesian Region API providers (e.g. EMSIFA, BinderByte, Custom API, Mock)
 */

export interface RegionItem {
  id: string;
  name: string;
}

export type Province = RegionItem;

export interface Regency extends RegionItem {
  province_id: string;
}

export interface District extends RegionItem {
  regency_id: string;
}

export interface Village extends RegionItem {
  district_id: string;
}

export interface RegionConnectionResult {
  success: boolean;
  provider: string;
  latencyMs: number;
  message?: string;
  error?: string;
}

/**
 * Standard Contract for Region API Providers
 */
export interface RegionProvider {
  name: string;
  getProvinces(): Promise<Province[]>;
  getRegencies(provinceId: string): Promise<Regency[]>;
  getDistricts(regencyId: string): Promise<District[]>;
  getVillages(districtId: string): Promise<Village[]>;
  testConnection(): Promise<RegionConnectionResult>;
}
