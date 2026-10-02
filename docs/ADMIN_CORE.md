# DOKUMENTASI ADMIN CORE — JETFOOD POLMAN
## Phase 3: Admin Dashboard & Manajemen Kurir

Dokumen ini memuat spesifikasi implementasi Admin Panel Core, mencakup ringkasan dashboard, manajemen kurir (CRUD), penegakan otorisasi, dan hasil regression testing untuk **JetFood Polman**.

---

### 1. Ringkasan Fitur Admin Core

#### A. Admin Dashboard ([src/app/(admin)/admin/dashboard/page.tsx](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/app/(admin)/admin/dashboard/page.tsx))
Menampilkan 4 metrik operasional esensial berbasis waktu nyata WITA (`Asia/Makassar`):
1. **Total Kurir:** Jumlah seluruh kurir yang terdaftar di database.
2. **Kurir Aktif:** Jumlah kurir berstatus `ACTIVE` yang siap bertugas di lapangan.
3. **Hadir Hari Ini:** Jumlah kurir yang telah melakukan presensi masuk pada tanggal kalender hari ini (WITA).
4. **Belum Absen:** Jumlah kurir aktif yang belum melakukan presensi hari ini (`max(0, active - present)`).

#### B. Manajemen Kurir ([src/app/(admin)/admin/couriers/page.tsx](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/app/(admin)/admin/couriers/page.tsx))
Admin memiliki kontrol penuh atas operasional kurir:
1. **Tambah Kurir:** Mendaftarkan akun kurir baru. Menggunakan `createAdminClient()` di server untuk membuat akun di `auth.users`, lalu mengaitkannya ke `profiles` dan `couriers`. Role dipatok mutlak sebagai `KURIR`.
2. **Lihat & Cari Kurir:** Tampilan tabel desktop dan kartu mobile responsif dengan fitur pencarian instan (nama, kode kurir, email) serta filter status (Semua, Aktif, Nonaktif).
3. **Edit Data:** Memperbarui nama lengkap, nomor telepon, jenis kendaraan, dan plat nomor kendaraan.
4. **Soft Deactivation:** Mengubah status aktif/nonaktif (`is_active = false`, `status = 'INACTIVE'`). Data historis dan laporan kurir di masa lalu tetap aman dan tidak rusak.
5. **Reset Kata Sandi Aman:** Admin dapat menetapkan kata sandi baru untuk kurir tanpa melalui login kurir, menggunakan Supabase Admin Auth API.

---

### 2. Aturan Keamanan & Bisnis

1. **Strict Role Enforcement:** Admin tidak dapat memberikan peran di luar `KURIR` pada saat pembuatan akun kurir. Tidak ada input bebas yang memungkinkan eskalasi hak istimewa (*privilege escalation*).
2. **Pencegahan Akun Duplikat:** Validasi server-side secara ketat menolak pendaftaran jika email atau `courier_code` sudah terdaftar di sistem.
3. **Perlindungan Riwayat (No Hard Delete):** Kurir yang sudah tidak bekerja tidak dihapus dari tabel, melainkan dinonaktifkan statusnya agar laporan omset dan order masa lalunya tetap utuh.
4. **Pencegahan Cascading Renders:** Form edit menggunakan pemisahan komponen dan rendering berbasis key unik (`key={courier.id}`) tanpa `useEffect` manipulasi state sinkron, mematuhi standar React 19.

---

### 3. Hasil Pengujian Mandatori (Phase 3 Test Suite)

Pengujian otomatis dijalankan melalui [test-phase3-admin.mjs](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/scripts/test-phase3-admin.mjs):

| # | Kasus Uji | Skenario | Hasil |
| :-: | :--- | :--- | :---: |
| 1 | **Input Validation** | Email tidak valid & sandi < 6 karakter | ✅ Ditangkap dan ditolak dengan pesan jelas |
| 2 | **Duplicate Account** | Email & Kode Kurir duplikat | ✅ Ditolak sebelum menyentuh database auth |
| 3 | **Create Courier** | Pendaftaran kurir baru oleh Admin | ✅ Berhasil, role dikunci ke `KURIR` |
| 4 | **Read & Search** | Pencarian kurir berdasarkan nama & kode | ✅ Query akurat memfilter data |
| 5 | **Update Courier** | Update profil & atribut kendaraan | ✅ Data berhasil diperbarui |
| 6 | **Status Toggle** | Soft deactivation `ACTIVE` $\rightarrow$ `INACTIVE` | ✅ Berhasil, `is_active` dan `status` sinkron |
| 7 | **Dashboard Metrics** | Formula kalkulasi metrik kurir & absensi | ✅ Perhitungan akurat sesuai data WITA |

---

### 4. Hasil Verifikasi Sistem & Regresi

* **ESLint (`npm run lint`):** ✅ **PASSED** (0 error, 0 warning)
* **Type Check (`npm run typecheck`):** ✅ **PASSED** (0 error)
* **Production Build (`npm run build`):** ✅ **PASSED** (Semua route terkompilasi dalam 1.3s)
* **Regression Testing:** ✅ **PASSED** (Test Phase 2 + Phase 3 lolos 100%)
