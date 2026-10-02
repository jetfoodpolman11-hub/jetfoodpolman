import {
  RegionProvider,
  Province,
  Regency,
  District,
  Village,
  RegionConnectionResult,
} from "../types";

/**
 * Mock Region Provider
 * Provides offline seed data for Sulawesi Barat and Polewali Mandar.
 * Used for testing and as a resilient fallback.
 */
export class MockRegionProvider implements RegionProvider {
  name = "Mock / Offline Regional Provider";

  private provinces: Province[] = [
    { id: "76", name: "SULAWESI BARAT" },
    { id: "73", name: "SULAWESI SELATAN" },
    { id: "72", name: "SULAWESI TENGAH" },
  ];

  private regencies: Regency[] = [
    { id: "7604", province_id: "76", name: "KABUPATEN POLEWALI MANDAR" },
    { id: "7602", province_id: "76", name: "KABUPATEN MAJENE" },
    { id: "7601", province_id: "76", name: "KABUPATEN MAMUJU" },
    { id: "7326", province_id: "73", name: "KABUPATEN TORAJA UTARA" },
    { id: "7317", province_id: "73", name: "KABUPATEN LUWU" },
  ];

  private districts: District[] = [
    { id: "760401", regency_id: "7604", name: "POLEWALI" },
    { id: "760402", regency_id: "7604", name: "WONOMULYO" },
    { id: "760403", regency_id: "7604", name: "TINAMBUNG" },
    { id: "760404", regency_id: "7604", name: "CAMPALAGIAN" },
    { id: "760405", regency_id: "7604", name: "MATAKALI" },
    { id: "760406", regency_id: "7604", name: "BINUANG" },
    { id: "760407", regency_id: "7604", name: "TAPANGO" },
  ];

  private villages: Village[] = [
    // Kecamatan Polewali (760401)
    { id: "7604011001", district_id: "760401", name: "MANDING" },
    { id: "7604011002", district_id: "760401", name: "MADATTE" },
    { id: "7604011003", district_id: "760401", name: "PEKKABATA" },
    { id: "7604011004", district_id: "760401", name: "TAKATIDUNG" },
    { id: "7604011005", district_id: "760401", name: "POLEWALI" },
    { id: "7604011006", district_id: "760401", name: "DARMA" },
    // Kecamatan Wonomulyo (760402)
    { id: "7604021001", district_id: "760402", name: "SIDODADI" },
    { id: "7604022002", district_id: "760402", name: "CAMPURJO" },
    { id: "7604022003", district_id: "760402", name: "BUMI MULYO" },
    { id: "7604022004", district_id: "760402", name: "SUGIHWARAS" },
    // Kecamatan Matakali (760405)
    { id: "7604051001", district_id: "760405", name: "MATAKALI" },
    { id: "7604052002", district_id: "760405", name: "PASIANG" },
    // Kecamatan Campalagian (760404)
    { id: "7604042001", district_id: "760404", name: "PARAPPE" },
    { id: "7604042002", district_id: "760404", name: "LALIKO" },
  ];

  async getProvinces(): Promise<Province[]> {
    return this.provinces;
  }

  async getRegencies(provinceId: string): Promise<Regency[]> {
    if (!provinceId) return [];
    return this.regencies.filter((r) => r.province_id === provinceId);
  }

  async getDistricts(regencyId: string): Promise<District[]> {
    if (!regencyId) return [];
    return this.districts.filter((d) => d.regency_id === regencyId);
  }

  async getVillages(districtId: string): Promise<Village[]> {
    if (!districtId) return [];
    return this.villages.filter((v) => v.district_id === districtId);
  }

  async testConnection(): Promise<RegionConnectionResult> {
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 10));
    return {
      success: true,
      provider: this.name,
      latencyMs: Date.now() - start,
      message: "Koneksi Mock Provider siap dan aktif (Offline Resilient)",
    };
  }
}
