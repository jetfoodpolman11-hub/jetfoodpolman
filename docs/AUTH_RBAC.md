# DOKUMENTASI SISTEM AUTENTIKASI & RBAC — JETFOOD POLMAN
## Phase 2: Authentication & Role-Based Access Control

Dokumen ini memuat spesifikasi implementasi autentikasi, otorisasi multi-layer, hasil pengujian, dan tinjauan keamanan (*security review*) untuk **JetFood Polman**.

---

### 1. Arsitektur Pertahanan Berlapis (Defense-in-Depth)

Sistem menerapkan 4 lapisan keamanan untuk memastikan peran (*role*) dan data tidak dapat dimanipulasi:

```
[Permintaan HTTP / Browser]
           │
           ▼
┌──────────────────────────────────────────────┐
│  Layer 1: Next.js 16 Proxy (proxy.ts)        │
│  - Refresh auth session cookie               │
│  - Redirect user tanpa token ke /login       │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Layer 2: Server Layouts (requireAdmin /     │
│           requireCourier guards)             │
│  - Ambil role autoritatif dari database      │
│  - Tendang Kurir jika mencoba masuk /admin   │
│  - Tendang Admin jika mengakses ruang kurir  │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Layer 3: Server Actions & Mutasi            │
│  - Validasi input di server                  │
│  - Pengecekan status akun aktif (is_active)  │
│  - Eksekusi mutasi dengan user context       │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Layer 4: PostgreSQL Row Level Security      │
│  - Kebijakan isolasi data di level database  │
│  - Kurir hanya bisa membaca record miliknya  │
│  - Admin memiliki akses penuh (is_admin())   │
└──────────────────────────────────────────────┘
```

---

### 2. Matriks Hak Akses & Pembagian Ruang

| Modul / URL | Role ADMIN | Role KURIR | Unauthenticated |
| :--- | :---: | :---: | :---: |
| `/login` | Redirect ke `/admin/dashboard` | Redirect ke `/courier/dashboard` | Diizinkan |
| `/admin/*` | **Diizinkan Penuh** | **Ditolak** (Redirect ke `/courier/dashboard`) | Redirect ke `/login` |
| `/courier/*` | Dialihkan ke `/admin/dashboard` | **Diizinkan** (Data isolasi diri) | Redirect ke `/login` |
| Laporan Kurir Lain | **Bisa dibaca (Rekap)** | **Ditolak oleh RLS** (0 baris dikembalikan) | Ditolak |
| Hapus Laporan | **Diizinkan** | **Dilarang keras** (Policy denied) | Ditolak |
| Master Data | **Kelola Penuh** | **Hanya Baca Data Aktif** | Ditolak |

---

### 3. Hasil Pengujian Mandatori (7 Test Scenarios)

Pengujian otomatis dijalankan melalui [test-auth-rbac.mjs](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/scripts/test-auth-rbac.mjs):

| # | Kasus Uji | Skenario | Hasil |
| :-: | :--- | :--- | :---: |
| 1 | **Admin Login** | Login dengan akun role `ADMIN` | ✅ Berhasil dialihkan ke `/admin/dashboard` |
| 2 | **Kurir Login** | Login dengan akun role `KURIR` | ✅ Berhasil dialihkan ke `/courier/dashboard` |
| 3 | **Kurir Akses URL Admin** | Kurir mencoba membuka `/admin/dashboard` | ✅ Diblokir oleh `requireAdmin()`, dialihkan ke dashboard kurir |
| 4 | **Kurir Akses Data Kurir Lain** | Kurir A mencoba query laporan Kurir B | ✅ Terisolasi oleh RLS (0 baris dikembalikan) |
| 5 | **Admin Membaca Data Kurir** | Admin query laporan seluruh kurir | ✅ Diizinkan penuh oleh fungsi `is_admin()` |
| 6 | **User Logout** | Eksekusi `logoutAction()` | ✅ Sesi dibersihkan, dialihkan ke `/login` |
| 7 | **Session Expired** | Akses route terproteksi tanpa sesi aktif | ✅ Dialihkan ke `/login?redirectTo=...` |

---

### 4. Security Review & Compliance

1. **Zero Client Trust:** Peran (*role*) pengguna tidak pernah dipercaya dari payload client / localStorage. Penentuan akses selalu membaca data dari tabel `profiles` via `auth.uid()`.
2. **Service Role Isolation:** `SUPABASE_SERVICE_ROLE_KEY` hanya diakses melalui `src/lib/supabase/admin.ts` yang dikunci dengan paket `server-only`. Tidak ada kunci rahasia yang masuk ke bundel JavaScript browser.
3. **Pencegahan Akun Nonaktif:** Akun kurir yang dinonaktifkan (`is_active = false`) langsung ditolak saat login dan dibatalkan sesinya jika mencoba mengakses sistem.
4. **Perlindungan Session Cookie:** Token disimpan dalam HTTP-Only secure cookies menggunakan `@supabase/ssr` dengan penanganan rotasi otomatis pada [proxy.ts](file:///d:/PROJECT/JetFood%20Polman/jetfoodpolman/src/proxy.ts).
