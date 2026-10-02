# DOKUMENTASI DASHBOARD KURIR — JETFOOD POLMAN
## Phase 5: Courier Dashboard & Field Navigation

Dokumen ini memuat spesifikasi implementasi dashboard khusus kurir di lapangan, navigasi mobile-first, isolasi data pribadi, dan hasil pengujian untuk **JetFood Polman**.

---

### 1. Karakteristik Antarmuka Kurir (Field-Focused UX)

Dashboard kurir dirancang dengan prinsip **Mobile-First & Kesederhanaan Operasional Lapangan**:
* Pengguna utama adalah kurir yang sedang mengendarai motor atau berada di titik pengantaran paket.
* UI menggunakan kartu berukuran besar, teks terbaca jelas, tombol aksi yang mudah disentuh (*touch-friendly*), serta bebas dari menu admin yang kompleks.

---

### 2. Fitur Utama Dashboard Kurir ([src/app/(courier)/courier/dashboard/page.tsx](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/app/(courier)/courier/dashboard/page.tsx))

1. **Header Sapaan & Identitas:**
   * Nama lengkap kurir: `Halo, [Nama Kurir]!`
   * Tanggal operasional harian format WITA: `Jumat, 02 Oktober 2026`
   * Badge kode kurir resmi: `JF-001`
   * Atribut kendaraan kerja: Jenis kendaraan (Motor/Mobil) dan plat nomor (`DC 1234 XX`).
2. **Kartu Status Presensi Hari Ini:**
   * Menampilkan status terkini:
     * 🔴 **Belum Absen** (dilengkapi tombol besar: `Absen Masuk Sekarang`)
     * 🟢 **Sudah Absen Masuk** (menampilkan jam masuk WITA dan tombol: `Absen Pulang`)
     * 🔵 **Sudah Selesai (Pulang)** (menampilkan jam masuk dan jam pulang lengkap)
   * Tombol aksi cerdas menyesuaikan status presensi tanpa membingungkan kurir.
3. **Tombol Cepat [ Input Laporan Harian ]:**
   * Tombol sorotan utama berwarna orange terang untuk mencatat rute keberangkatan, tujuan, jumlah order, dan omset harian.
4. **Metrik Harian Pribadi:**
   * Total order hari ini: `X paket`
   * Total omset hari ini: `Rp Y`
   * Jumlah rute yang sudah dilaporkan hari ini.
5. **Laporan Terbaru Saya:**
   * Menampilkan daftar 5 laporan terakhir yang diinput oleh kurir yang bersangkutan.
   * Format display rute terstruktur: `Manding, Polewali → Madatte, Polewali`.
   * Dilengkapi badge jenis paket, jumlah order, dan nominal omset.
   * *Zero-state handling:* Jika kurir baru belum memiliki laporan, sistem menampilkan pesan panduan ramah tanpa menimbulkan galat/crash.

---

### 3. Struktur Navigasi Khusus Kurir ([src/app/(courier)/courier/layout.tsx](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/app/(courier)/courier/layout.tsx))

Navigasi kurir terisolasi sepenuhnya dan **tidak memuat menu admin sama sekali**:
* **Mobile Bottom Bar (Fixed Bawah):**
  1. **Beranda:** `/courier/dashboard`
  2. **Absen:** `/courier/attendance`
  3. **Laporan:** `/courier/reports/new`
  4. **Riwayat:** `/courier/history`
* **Header Atas:**
  * Logo & nama aplikasi `JetFood Polman`
  * Kode kurir aktif
  * Tombol **Keluar (Logout)**

---

### 4. Keamanan & Isolasi Data (Security & RLS)

* **Otorisasi Server Guard:** Halaman diproteksi mutlak oleh `requireCourier()`. Jika pengguna berstatus `role = 'ADMIN'`, sistem langsung mengalihkannya ke `/admin/dashboard`.
* **Zero Cross-Data Leakage:** Kurir hanya dapat melihat riwayat absensi dan laporan miliknya sendiri (`courier_id = public.get_auth_courier_id()`). Percobaan membaca baris kurir lain via query API maupun URL otomatis difilter 0 baris oleh PostgreSQL Row Level Security (RLS).
* **Zona Waktu Baku:** Seluruh jam presensi diformat menggunakan waktu resmi **WITA (`Asia/Makassar`)** (contoh: `08.01 WITA`).

---

### 5. Hasil Pengujian Mandatori (7 Skenario)

Dijalankan melalui [scripts/test-phase5-courier.mjs](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/scripts/test-phase5-courier.mjs):

| # | Kasus Uji | Skenario Pengujian | Hasil |
| :-: | :--- | :--- | :---: |
| 1 | **Admin Akses Portal Kurir** | Admin mencoba masuk `/courier/*` | ✅ Dicegat, di-redirect ke `/admin/dashboard` |
| 2 | **Kurir Akses Dashboard** | Kurir masuk `/courier/dashboard` | ✅ Diizinkan, data kurir dimuat |
| 3 | **Kurir Tanpa Data (Zero State)** | Akun kurir baru tanpa histori | ✅ Tampilan bersih tanpa error/crash |
| 4 | **Isolasi Data Kurir** | Kurir A membaca data Kurir B | ✅ Terisolasi penuh (0 data bocor) |
| 5 | **Sesi Kedaluwarsa** | Akses tanpa token aktif | ✅ Dialihkan ke `/login?redirectTo=...` |
| 6 | **Audit Navigasi** | Verifikasi menu kurir terhadap rute admin | ✅ Bersih, 0 link admin di portal kurir |
| 7 | **Format Waktu WITA** | Konversi timestamp UTC ke WITA | ✅ Akurat (contoh: 00:01 UTC $\rightarrow$ 08.01 WITA) |

---

### 6. Hasil Verifikasi Sistem & Regresi

* **ESLint (`npm run lint`):** ✅ **PASSED** (0 error, 0 warning)
* **Type Check (`npm run typecheck`):** ✅ **PASSED** (0 error)
* **Production Build (`npm run build`):** ✅ **PASSED** (Semua route kurir terkompilasi dynamic on demand)
* **Regression Testing:** ✅ **PASSED** (Phase 2, 3, 4, 5 lolos 100%)
