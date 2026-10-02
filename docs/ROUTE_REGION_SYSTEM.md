# JETFOOD POLMAN — DOKUMENTASI SISTEM RUTE & WILAYAH (PHASE 8)

Sistem Rute dan Wilayah JETFOOD POLMAN mengimplementasikan pemilihan rute dinamis berbasis API Wilayah Indonesia yang terstruktur secara hierarkis dan terintegrasi dengan laporan operasional harian kurir.

---

## 1. Konsep & Filosofi Rute

- **Bukan Master Data Statis**: Rute tidak disimpan sebagai daftar string statis yang kaku di database, melainkan dibentuk secara dinamis dari kombinasi dua titik wilayah hierarki administratif Indonesia:
  - **Departure (Keberangkatan)**: `Provinsi` → `Kabupaten/Kota` → `Kecamatan` → `Desa/Kelurahan`
  - **Destination (Tujuan)**: `Provinsi` → `Kabupaten/Kota` → `Kecamatan` → `Desa/Kelurahan`

- **Format Tampilan Baku**:
  - Format standar dalam kabupaten/kota:  
    `Manding, Polewali → Madatte, Polewali`
  - Format antar-kabupaten/kota:  
    `Manding, Polewali (Kab. Polewali Mandar) → Banggae, Banggae (Kab. Majene)`

- **Aturan Kurir**:
  - Kurir **tidak mengetik** teks wilayah secara manual.
  - Kurir **hanya memilih** opsi yang valid dari dropdown bertingkat API Wilayah Indonesia.
  - Kurir **tidak dapat menambah atau memanipulasi** master data wilayah.

---

## 2. Aturan Bisnis Rute (Business Rules)

| Kondisi | Status | Keterangan & Tindakan Sistem |
| :--- | :---: | :--- |
| **Beda Kabupaten** | **VALID** | Rute pengiriman antar-kabupaten/kota sah. Ditampilkan lengkap dengan nama kab/kota. |
| **Beda Kecamatan** | **VALID** | Rute pengiriman antar-kecamatan dalam satu kabupaten sah (contoh: Polewali ke Wonomulyo). |
| **Kecamatan Sama** | **VALID** | Rute antar-desa dalam satu kecamatan sah (contoh: Manding, Polewali ke Madatte, Polewali). |
| **Desa Sama (Identik)** | **TIDAK SAH** | Titik keberangkatan dan tujuan tidak boleh desa/kelurahan yang sama (`origin_village_id === dest_village_id`). Ditolak dengan pesan validasi jelas. |
| **Pilihan Belum Lengkap** | **TIDAK SAH** | Pemilihan harus tuntas sampai level 4 (Desa/Kelurahan). |
| **ID / Hierarki Tidak Valid** | **TIDAK SAH** | Kode wilayah wajib mematuhi standar Kemendagri (Provinsi 2 digit, Kab 4 digit, Kec 6-7 digit, Desa 10 digit, dan prefix turunan harus sesuai). |

---

## 3. Desain UX & Ketahanan API (Resilience)

### 3.1 Cascading Dropdown Mandiri
- Dropdown keberangkatan (Departure) dan tujuan (Destination) berjalan secara **independen**.
- Mengubah atau mereset wilayah keberangkatan **tidak merusak atau menghapus** wilayah tujuan yang sudah dipilih, dan sebaliknya.
- Form menyimpan input metrik lainnya (jumlah order, omset, ojol, jastip, catatan) di tingkat state induk, sehingga perubahan rute **tidak menyebabkan kehilangan input lain**.

### 3.2 Penanganan Kegagalan API (API Failure Handling)
- Jika API wilayah gagal (HTTP error atau timeout):
  - Sistem menampilkan banner peringatan yang jelas pada kartu wilayah bersangkutan.
  - Disediakan tombol **"Coba Lagi" (Retry)** untuk memicu pengambilan data ulang tanpa me-reload seluruh halaman.
  - Sistem menggunakan in-memory cache dan fallback lokal agar kurir tetap dapat melanjutkan pekerjaan di area operasional utama (Sulawesi Barat / Polewali Mandar).
  - Sistem menolak penyimpanan laporan jika data wilayah belum tervalidasi.

---

## 4. Penyimpanan Data (Data Storage)

Sistem menyimpan ID kode resmi dan nama wilayah secara terpisah pada tabel `daily_reports`, bukan hanya string rute gabungan:

```sql
-- Kolom Keberangkatan (Origin)
origin_province_id   TEXT NOT NULL,
origin_province_name TEXT NOT NULL,
origin_regency_id    TEXT NOT NULL,
origin_regency_name  TEXT NOT NULL,
origin_district_id   TEXT NOT NULL,
origin_district_name TEXT NOT NULL,
origin_village_id    TEXT NOT NULL,
origin_village_name  TEXT NOT NULL,

-- Kolom Tujuan (Destination)
dest_province_id     TEXT NOT NULL,
dest_province_name   TEXT NOT NULL,
dest_regency_id      TEXT NOT NULL,
dest_regency_name    TEXT NOT NULL,
dest_district_id     TEXT NOT NULL,
dest_district_name   TEXT NOT NULL,
dest_village_id      TEXT NOT NULL,
dest_village_name    TEXT NOT NULL
```

Field `routeDisplay` dihitung secara derivatif menggunakan fungsi `formatRouteDisplay(origin, destination)`.

---

## 5. Ringkasan Verifikasi & Pengujian (Test Suite)

Pengujian otomatis dilakukan melalui skrip `scripts/test-phase8-routes.mjs` yang mencakup 10 skenario:

1. **Test 1: Beda Kabupaten** (Polman → Majene) → **VALID**
2. **Test 2: Beda Kecamatan** (Polewali → Wonomulyo) → **VALID**
3. **Test 3: Kecamatan Sama** (Manding, Polewali → Madatte, Polewali) → **VALID**
4. **Test 4: Desa Sama** (Manding → Manding) → **REJECTED**
5. **Test 5: API Error Handling** (Simulasi 503 & tombol Retry) → **PASS**
6. **Test 6: API Timeout Handling** (AbortController signal timeout) → **PASS**
7. **Test 7: Reset Selection** (Reset asal tidak mereset tujuan & metrik) → **PASS**
8. **Test 8: Invalid Regional ID** (Format karakter/panjang/prefix salah) → **REJECTED**
9. **Test 9: Format Display String** (`Manding, Polewali → Madatte, Polewali`) → **MATCH**
10. **Test 10: Integritas Database** (ID & Nama tersimpan terstruktur) → **PASS**

Hasil pengujian regresi:
- `test-auth-rbac.mjs`: **7/7 PASSED**
- `test-phase3-admin.mjs`: **7/7 PASSED**
- `test-phase4-master-data.mjs`: **8/8 PASSED**
- `test-phase5-courier.mjs`: **7/7 PASSED**
- `test-phase6-attendance.mjs`: **10/10 PASSED**
- `test-phase7-reports.mjs`: **10/10 PASSED**
- `test-phase8-routes.mjs`: **10/10 PASSED**
- TypeScript typecheck: **0 ERRORS**
- ESLint: **0 ERRORS**
- Next.js build: **SUCCESS (Exit Code 0)**
