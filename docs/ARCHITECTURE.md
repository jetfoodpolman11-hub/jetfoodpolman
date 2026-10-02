# ARSITEKTUR SISTEM — JETFOOD POLMAN
## Courier Operations Web App

Dokumen ini mencatat keputusan arsitektur utama, struktur proyek, dan fondasi teknis untuk **JetFood Polman** yang ditetapkan pada **Phase 0 (Project Foundation)**.

---

### 1. Ringkasan Eksekutif & Filosofi Desain
* **Tujuan:** Aplikasi web internal untuk mencatat dan memonitor aktivitas kurir, absensi, rute harian, order, omset, jenis paket, ojol, dan jastip di wilayah Polewali Mandar (Sulawesi Barat).
* **Target Pengguna:** 
  1. **Admin:** Manajemen penuh atas seluruh data kurir, absensi, laporan operasional, jenis paket, dan analitik.
  2. **Kurir:** Antarmuka mobile-friendly sederhana khusus untuk presensi (masuk/pulang), penginputan laporan harian, dan melihat riwayat diri.
* **Scope Boundary (Non-Goals):** Tidak ada customer login, payment gateway, checkout e-commerce, tracking GPS real-time, atau payroll.

---

### 2. Tech Stack & Standar Development
* **Framework:** Next.js (App Router, React 19, TypeScript)
* **Styling:** Tailwind CSS v4
* **Database & Auth:** Supabase PostgreSQL + Supabase Auth
* **Session Management:** `@supabase/ssr` (Server Components, Server Actions, Middleware)
* **Deploy Target:** Vercel (Production deployment ditahan hingga Phase 14)
* **Version Control:** Git (Local-first; no remote push during active iterative dev)

---

### 3. Struktur Folder & Separation of Concerns

```
src/
├── actions/                  # Server Actions (Mutasi data, Auth, Absensi, Laporan)
├── app/                      # Next.js App Router
│   ├── (auth)/login/         # Halaman autentikasi terpadu
│   ├── (admin)/admin/        # Area khusus Admin (Dashboard, Kurir, Laporan, Master Data)
│   ├── (courier)/courier/    # Area khusus Kurir (Dashboard, Absen, Input Laporan, Riwayat)
│   ├── api/                  # API endpoints / webhooks jika diperlukan
│   ├── globals.css           # Tailwind base styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing portal JetFood Polman
├── components/
│   ├── ui/                   # Reusable primitive UI components (Button, Input, Card, Badge)
│   ├── shared/               # Shared components (Navbar, Header, Layout wrappers)
│   ├── admin/                # Komponen spesifik modul Admin
│   └── courier/              # Komponen spesifik modul Kurir (Mobile optimized)
├── lib/
│   ├── auth/                 # Logika role, permission, dan session helper
│   ├── supabase/             # Client factory (client.ts, server.ts, middleware.ts, admin.ts)
│   ├── validations/          # Validasi skema input (Auth, Absensi, Laporan, Kurir)
│   ├── constants.ts          # Definisi konstan, enum role, status, rute
│   ├── date.ts               # Formatter tanggal & waktu berbasis WITA (Asia/Makassar)
│   ├── env.ts                # Environment variable reader & validator
│   └── utils.ts              # Helper functions (cn, formatRupiah, formatNumber)
├── types/
│   └── database.types.ts     # TypeScript definitions untuk Supabase PostgreSQL
└── middleware.ts             # Route guard & cookie session refresher
```

---

### 4. Keputusan Arsitektur Kritis

#### A. Zona Waktu Baku (WITA — `Asia/Makassar`)
* JetFood Polman beroperasi di Sulawesi Barat.
* Seluruh pencatatan absensi (*clock in*, *clock out*) dan tanggal operasional harian dinormalisasi ke zona waktu **WITA (`Asia/Makassar`, UTC+8)** menggunakan helper di `src/lib/date.ts`.
* Menghindari ambiguitas perbedaan waktu server Vercel (UTC) dan browser lokal kurir.

#### B. Isolasi Kredensial Supabase
* **Client & SSR Client:** Menggunakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* **Admin / Service Role Client:** Disimpan dalam `src/lib/supabase/admin.ts` dengan proteksi `import "server-only"`. Kunci `SUPABASE_SERVICE_ROLE_KEY` **tidak pernah** bocor ke client bundle.
* **RLS (Row Level Security):** Otorisasi utama dipaksakan pada PostgreSQL level melalui RLS. Kurir hanya dapat membaca/menulis record miliknya sendiri (`auth.uid()`), sedangkan Admin memiliki bypass/kebijakan penuh.

#### C. Model Wilayah & Rute Dinamis
* Tidak membuat tabel master kombinasi rute statis.
* Wilayah menggunakan struktur berjenjang (*Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa*) via API Wilayah Indonesia.
* Laporan mencatat ID dan Nama titik keberangkatan serta titik tujuan.
* Aturan bisnis: Keberangkatan dan tujuan tidak boleh identik pada tingkat wilayah terkecil yang dipilih.

#### D. Pencegahan Kesalahan Absensi
* Absen masuk hanya boleh dilakukan 1x per kurir per hari.
* Absen pulang mensyaratkan kurir telah absen masuk terlebih dahulu pada tanggal yang sama.
* Absen pulang tidak boleh dilakukan ganda.

---

### 5. Strategi Environment Variable
* Konfigurasi tercantum di `.env.example`.
* Variabel divalidasi melalui `src/lib/env.ts`.
* File `.env.local` lokal digunakan untuk dev/build tanpa perlu menghubungkan kredensial produksi.
