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
    { id: "7602050", regency_id: "7602", name: "POLEWALI" },
    { id: "7602051", regency_id: "7602", name: "BINUANG" },
    { id: "7602052", regency_id: "7602", name: "ANREAPI" },
    { id: "7602043", regency_id: "7602", name: "MATAKALI" },
  ];

  private villages: Village[] = [
    // 1. Kecamatan Polewali (7602050)
    { id: "7602050001", district_id: "7602050", name: "DARMA" },
    { id: "7602050002", district_id: "7602050", name: "MANDING" },
    { id: "7602050003", district_id: "7602050", name: "MADATTE" },
    { id: "7602050004", district_id: "7602050", name: "PEKKABATA" },
    { id: "7602050005", district_id: "7602050", name: "TAKATIDUNG" },
    { id: "7602050006", district_id: "7602050", name: "LANTORA" },
    { id: "7602050007", district_id: "7602050", name: "SULEWATANG" },
    { id: "7602050008", district_id: "7602050", name: "WATTANG" },
    { id: "7602050009", district_id: "7602050", name: "POLEWALI" },

    // 2. Kecamatan Binuang (7602051)
    { id: "7602051001", district_id: "7602051", name: "TONYAMAN" },
    { id: "7602051002", district_id: "7602051", name: "AMASSANGAN" },
    { id: "7602051003", district_id: "7602051", name: "MIRRING" },
    { id: "7602051004", district_id: "7602051", name: "PAKU" },
    { id: "7602051005", district_id: "7602051", name: "BATETANGNGA" },
    { id: "7602051006", district_id: "7602051", name: "KUAJANG" },
    { id: "7602051007", district_id: "7602051", name: "MAMMI" },
    { id: "7602051008", district_id: "7602051", name: "KALEOK" },
    { id: "7602051009", district_id: "7602051", name: "REA" },
    { id: "7602051010", district_id: "7602051", name: "AMOLA" },

    // 3. Kecamatan Anreapi (7602052)
    { id: "7602052002", district_id: "7602052", name: "ANREAPI" },
    { id: "7602052003", district_id: "7602052", name: "KELAPA DUA" },
    { id: "7602052004", district_id: "7602052", name: "PAPPANDANGAN" },
    { id: "7602052005", district_id: "7602052", name: "DUAMPANUA" },
    { id: "7602052006", district_id: "7602052", name: "KUNYI" },

    // 4. Kecamatan Matakali (7602043)
    { id: "7602043002", district_id: "7602043", name: "PATAMPANUA" },
    { id: "7602043003", district_id: "7602043", name: "MATAKALI" },
    { id: "7602043004", district_id: "7602043", name: "TONRO LIMA" },
    { id: "7602043005", district_id: "7602043", name: "INDUMAKKOMBONG" },
    { id: "7602043006", district_id: "7602043", name: "BARUMBUNG" },
    { id: "7602043007", district_id: "7602043", name: "PASIANG" },
    { id: "7602043008", district_id: "7602043", name: "BUNGA BUNGA" },
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
