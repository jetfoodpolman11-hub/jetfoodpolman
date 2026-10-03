import {
  RegionProvider,
  Province,
  Regency,
  District,
  Village,
  RegionConnectionResult,
} from "../types";
import { MockRegionProvider } from "./mock";

export class EmsifaRegionProvider implements RegionProvider {
  name = "EMSIFA API Wilayah Indonesia (GitHub CDN)";
  private baseUrl: string;
  private timeoutMs: number;
  private fallbackProvider: MockRegionProvider;

  // In-memory caching for ultra-fast cascaded dropdowns and zero redundant HTTP
  private cache = new Map<string, unknown>();

  constructor(
    baseUrl = "https://emsifa.github.io/api-wilayah-indonesia/api",
    timeoutMs = 5000
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
    this.fallbackProvider = new MockRegionProvider();
  }

  private async fetchWithTimeout<T>(url: string): Promise<T> {
    if (this.cache.has(url)) {
      return this.cache.get(url) as T;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 }, // Next.js ISR cache: 24 hours
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;
      this.cache.set(url, data);
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getProvinces(): Promise<Province[]> {
    const url = `${this.baseUrl}/provinces.json`;
    try {
      return await this.fetchWithTimeout<Province[]>(url);
    } catch (error) {
      console.warn("EMSIFA getProvinces failed, falling back to local provider:", error);
      return this.fallbackProvider.getProvinces();
    }
  }

  async getRegencies(provinceId: string): Promise<Regency[]> {
    if (!provinceId) return [];
    const url = `${this.baseUrl}/regencies/${provinceId}.json`;
    try {
      return await this.fetchWithTimeout<Regency[]>(url);
    } catch (error) {
      console.warn(`EMSIFA getRegencies(${provinceId}) failed, falling back:`, error);
      return this.fallbackProvider.getRegencies(provinceId);
    }
  }

  async getDistricts(regencyId: string): Promise<District[]> {
    if (!regencyId) return [];
    // Authoritative 4 operational districts for Kabupaten Polewali Mandar (7602)
    if (regencyId === "7602") {
      return this.fallbackProvider.getDistricts("7602");
    }
    const url = `${this.baseUrl}/districts/${regencyId}.json`;
    try {
      return await this.fetchWithTimeout<District[]>(url);
    } catch (error) {
      console.warn(`EMSIFA getDistricts(${regencyId}) failed, falling back:`, error);
      return this.fallbackProvider.getDistricts(regencyId);
    }
  }

  async getVillages(districtId: string): Promise<Village[]> {
    if (!districtId) return [];
    // Authoritative 31 official kelurahan/desa for Polewali Mandar's 4 operational districts
    if (districtId.startsWith("7602")) {
      return this.fallbackProvider.getVillages(districtId);
    }
    const url = `${this.baseUrl}/villages/${districtId}.json`;
    try {
      return await this.fetchWithTimeout<Village[]>(url);
    } catch (error) {
      console.warn(`EMSIFA getVillages(${districtId}) failed, falling back:`, error);
      return this.fallbackProvider.getVillages(districtId);
    }
  }

  async testConnection(): Promise<RegionConnectionResult> {
    const start = Date.now();
    const url = `${this.baseUrl}/provinces.json`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const latency = Date.now() - start;
      return {
        success: true,
        provider: this.name,
        latencyMs: latency,
        message: `Terhubung ke EMSIFA API (${latency} ms). Respon HTTP 200 OK.`,
      };
    } catch (error: unknown) {
      const latency = Date.now() - start;
      const errMsg = error instanceof Error ? error.message : "Network error";
      return {
        success: false,
        provider: this.name,
        latencyMs: latency,
        error: errMsg,
        message: `Gagal terhubung ke remote EMSIFA API: ${errMsg}. Fallback regional provider tetap aktif.`,
      };
    }
  }
}
