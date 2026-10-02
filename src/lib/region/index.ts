import { RegionProvider } from "./types";
import { EmsifaRegionProvider } from "./providers/emsifa";
import { MockRegionProvider } from "./providers/mock";
import { env } from "../env";

class RegionService {
  private activeProvider: RegionProvider;
  private providerType: "emsifa" | "mock" = "emsifa";

  constructor() {
    this.activeProvider = new EmsifaRegionProvider(env.regionApi.baseUrl);
  }

  setProvider(type: "emsifa" | "mock", customUrl?: string) {
    this.providerType = type;
    if (type === "mock") {
      this.activeProvider = new MockRegionProvider();
    } else {
      this.activeProvider = new EmsifaRegionProvider(
        customUrl || env.regionApi.baseUrl
      );
    }
  }

  getProvider(): RegionProvider {
    return this.activeProvider;
  }

  getProviderInfo() {
    return {
      type: this.providerType,
      name: this.activeProvider.name,
      baseUrl: env.regionApi.baseUrl,
    };
  }

  async getProvinces() {
    return this.activeProvider.getProvinces();
  }

  async getRegencies(provinceId: string) {
    return this.activeProvider.getRegencies(provinceId);
  }

  async getDistricts(regencyId: string) {
    return this.activeProvider.getDistricts(regencyId);
  }

  async getVillages(districtId: string) {
    return this.activeProvider.getVillages(districtId);
  }

  async testConnection() {
    return this.activeProvider.testConnection();
  }
}

// Global singleton instance
export const regionService = new RegionService();
