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
    { id: "7601", province_id: "76", name: "KABUPATEN MAJENE" },
    { id: "7602", province_id: "76", name: "KABUPATEN POLEWALI MANDAR" },
    { id: "7603", province_id: "76", name: "KABUPATEN MAMASA" },
    { id: "7604", province_id: "76", name: "KABUPATEN MAMUJU" },
    { id: "7326", province_id: "73", name: "KABUPATEN TORAJA UTARA" },
    { id: "7317", province_id: "73", name: "KABUPATEN LUWU" },
  ];

  private districts: District[] = [
    { id: "7602010", regency_id: "7602", name: "TINAMBUNG" },
    { id: "7602011", regency_id: "7602", name: "BALANIPA" },
    { id: "7602012", regency_id: "7602", name: "LIMBORO" },
    { id: "7602020", regency_id: "7602", name: "TUBBI TARAMANU" },
    { id: "7602021", regency_id: "7602", name: "ALU" },
    { id: "7602030", regency_id: "7602", name: "CAMPALAGIAN" },
    { id: "7602031", regency_id: "7602", name: "LUYO" },
    { id: "7602040", regency_id: "7602", name: "WONOMULYO" },
    { id: "7602041", regency_id: "7602", name: "MAPILLI" },
    { id: "7602042", regency_id: "7602", name: "TAPANGO" },
    { id: "7602043", regency_id: "7602", name: "MATAKALI" },
    { id: "7602044", regency_id: "7602", name: "BULO" },
    { id: "7602050", regency_id: "7602", name: "POLEWALI" },
    { id: "7602051", regency_id: "7602", name: "BINUANG" },
    { id: "7602052", regency_id: "7602", name: "ANREAPI" },
    { id: "7602061", regency_id: "7602", name: "MATANGNGA" },
  ];

  private villages: Village[] = [
    // Kecamatan Polewali (7602050)
    { id: "7602050001", district_id: "7602050", name: "DARMA" },
    { id: "7602050002", district_id: "7602050", name: "MANDING" },
    { id: "7602050003", district_id: "7602050", name: "MADATTE" },
    { id: "7602050004", district_id: "7602050", name: "PEKKABATA" },
    { id: "7602050005", district_id: "7602050", name: "TAKATIDUNG" },
    { id: "7602050006", district_id: "7602050", name: "LANTORA" },
    { id: "7602050007", district_id: "7602050", name: "SULEWATANG" },
    { id: "7602050008", district_id: "7602050", name: "WATTANG" },
    { id: "7602050009", district_id: "7602050", name: "POLEWALI" },
    // Kecamatan Wonomulyo (7602040)
    { id: "7602040001", district_id: "7602040", name: "TUMPILING" },
    { id: "7602040006", district_id: "7602040", name: "BUMIAYU" },
    { id: "7602040007", district_id: "7602040", name: "BUMI MULYO" },
    { id: "7602040008", district_id: "7602040", name: "SIDOREJO" },
    { id: "7602040009", district_id: "7602040", name: "SIDODADI" },
    { id: "7602040010", district_id: "7602040", name: "CAMPURJO" },
    { id: "7602040015", district_id: "7602040", name: "SUGIH WARAS" },
    // Kecamatan Matakali (7602043)
    { id: "7602043001", district_id: "7602043", name: "MATAKALI" },
    { id: "7602043002", district_id: "7602043", name: "PASIANG" },
    // Kecamatan Campalagian (7602030)
    { id: "7602030001", district_id: "7602030", name: "PARAPPE" },
    { id: "7602030002", district_id: "7602030", name: "LALIKO" },
    // Kecamatan Tinambung (7602010)
    { id: "7602010001", district_id: "7602010", name: "BATULAYA" },
    { id: "7602010002", district_id: "7602010", name: "TINAMBUNG" },
    // Kecamatan Binuang (7602051)
    { id: "7602051001", district_id: "7602051", name: "AMASSANGAN" },
    { id: "7602051002", district_id: "7602051", name: "BINUANG" },
    // Kecamatan Tapango (7602042)
    { id: "7602042001", district_id: "7602042", name: "TAPANGO" },
    { id: "7602042002", district_id: "7602042", name: "RAPPOANG" },
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
