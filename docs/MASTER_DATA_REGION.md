# DOKUMENTASI MASTER DATA & INTEGRASI WILAYAH — JETFOOD POLMAN
## Phase 4: Master Data & Region Integration Foundation

Dokumen ini memuat spesifikasi implementasi pengelolaan Jenis Paket dan Arsitektur Abstraksi Integrasi API Wilayah Indonesia untuk **JetFood Polman**.

---

### 1. Master Data Jenis Paket ([src/actions/package-types.ts](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/actions/package-types.ts))

* **Tujuan:** Mengelola kategori muatan kiriman operasional JetFood Polman.
* **Fitur Admin:**
  1. **Tambah Jenis Paket:** Menambahkan kategori unik (contoh: Reguler, Express, Dokumen, Cargo, Makanan & Minuman) dengan validasi duplikasi nama.
  2. **Edit Jenis Paket:** Memperbarui nama dan keterangan penanganan.
  3. **Soft Status Toggle:** Mengubah status `is_active` (`true` $\leftrightarrow$ `false`).
* **Aturan Otorisasi Kurir:**
  Kurir hanya dapat memilih jenis paket yang berstatus **Aktif (`is_active = true`)** pada dropdown penginputan laporan harian. Kurir dilarang memanipulasi atau menambahkan jenis paket baru.

---

### 2. Arsitektur Abstraksi API Wilayah Indonesia

Sistem **tidak membuat tabel database manual** untuk seluruh desa/kecamatan di Indonesia, melainkan menggunakan pola **Service Abstraction Layer**:

```
┌────────────────────────────────────────────────────────┐
│                   Aplikasi Kurir / Admin               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             RegionService (Singleton Abstraction)     │
│             - In-memory Caching (Zero redundant calls) │
│             - Timeout Guard (5000ms AbortController)  │
│             - Hierarchy Continuity Validator           │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       (Default Provider)       (Resilient Fallback)
                ▼                        ▼
┌────────────────────────────┐ ┌───────────────────────────┐
│ EmsifaRegionProvider       │ │ MockRegionProvider        │
│ - Remote GitHub CDN API    │ │ - Local Polman & Sulbar   │
│ - 38 Provinsi              │ │ - Siap Offline & Resilient│
│ - Cache ISR Next.js (24h)  │ │ - Siap Pengujian Otomatis │
└────────────────────────────┘ └───────────────────────────┘
```

#### Hierarki Wilayah Bertingkat (Cascade Flow):
$$\text{Provinsi} \longrightarrow \text{Kabupaten/Kota} \longrightarrow \text{Kecamatan} \longrightarrow \text{Desa/Kelurahan}$$

1. **Provinsi:** `getProvinces()`
2. **Kabupaten/Kota:** `getRegencies(provinceId)`
3. **Kecamatan:** `getDistricts(regencyId)`
4. **Desa/Kelurahan:** `getVillages(districtId)`

---

### 3. Keandalan & Strategi Penanganan Masalah (Resilience Strategy)

1. **Timeout & Failure Handling:** Pemanggilan HTTP dibatasi dengan timeout 5 detik (`AbortController`). Jika penyedia remote gagal atau lambat, sistem secara otomatis mengalihkan permintaan ke provider regional lokal tanpa memutus operasional kurir.
2. **In-Memory Caching:** Hasil respons wilayah disimpan dalam memori. Pemanggilan berulang dengan ID yang sama (misal memilih Kabupaten Polewali Mandar berkali-kali) dilayani instan dari cache lokal (0 ms HTTP latency).
3. **Validasi Rute (Origin $\ne$ Destination):** Sistem memvalidasi titik keberangkatan dan tujuan tidak boleh identik pada tingkat kelurahan/desa (misal: `Manding -> Manding` ditolak, namun `Manding -> Madatte` sah).
4. **Validasi Hierarki:** Permintaan sub-wilayah tanpa ID induk (misal meminta kecamatan tanpa `regencyId`) langsung mengembalikan array kosong tanpa melakukan panggilan jaringan sia-sia.

---

### 4. Hasil Pengujian Mandatori (Phase 4 Test Suite)

Dijalankan melalui [scripts/test-phase4-master-data.mjs](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/scripts/test-phase4-master-data.mjs):

| # | Kasus Uji | Skenario Pengujian | Hasil |
| :-: | :--- | :--- | :---: |
| 1 | **Jenis Paket CRUD** | Create, Update, dan Toggle Status Paket | ✅ **PASSED** |
| 2 | **Akses Kurir Paket Aktif** | Kurir dibatasi hanya dapat memilih paket aktif | ✅ **PASSED** |
| 3 | **Resolusi Hierarki API** | Cascade Sulbar $\rightarrow$ Polman $\rightarrow$ Polewali $\rightarrow$ Manding | ✅ **PASSED** |
| 4 | **Penanganan Timeout** | Simulasi network delay melebihi batas waktu | ✅ **PASSED** (Fallback aktif) |
| 5 | **Penanganan Error/404** | ID wilayah tidak ditemukan / HTTP Error | ✅ **PASSED** (Safe empty array) |
| 6 | **Validasi Hierarki Kosong** | Request child tanpa parent ID | ✅ **PASSED** (0 panggilan jaringan) |
| 7 | **Validasi Rute Duplikat** | Validasi asal $\ne$ tujuan pada tingkat desa | ✅ **PASSED** |
| 8 | **Strategi Caching** | Panggilan kedua diambil dari cache | ✅ **PASSED** (0 network call) |

---

### 5. Hasil Verifikasi Sistem

* **ESLint (`npm run lint`):** ✅ **PASSED** (0 error, 0 warning)
* **Type Check (`npm run typecheck`):** ✅ **PASSED** (0 error)
* **Production Build (`npm run build`):** ✅ **PASSED** (Route `/admin/master-data` terkompilasi dynamic on demand)
* **Regression Testing:** ✅ **PASSED** (Phase 2 + Phase 3 + Phase 4 lolos 100%)
