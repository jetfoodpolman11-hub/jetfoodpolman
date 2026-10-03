# JETFOOD POLMAN — Production Readiness & Deployment Checklists (Phase 13)

> **IMPORTANT:** Do NOT execute production deployment during Phase 13. This document serves as the authoritative pre-flight runbook and verification checklist for production deployment.

---

## 1. Environment Variable Checklist

### Required Production Variables
Configure all of the following variables in the production hosting environment (Vercel Project Settings → Environment Variables), matching [`.env.example`](../.env.example):

| Variable | Visibility | Scope | Description & Validation Rules |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Production / Preview | Full HTTPS URL of the production Supabase project (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Production / Preview | Supabase `anon` public JWT key. Safe for browser bundle ONLY when RLS is enabled on all tables. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET (Server-Only)** | Production / Preview | Supabase `service_role` key. Used exclusively in [`src/lib/supabase/admin.ts`](../src/lib/supabase/admin.ts) (protected by `import "server-only"`). **NEVER prefix with `NEXT_PUBLIC_`.** |
| `SESSION_SECRET` | **SECRET (Server-Only)** | Production / Preview | 64-character random hex secret (`openssl rand -hex 32`) used by [`src/lib/auth/cookie-signer.ts`](../src/lib/auth/cookie-signer.ts) to sign/verify `jetfood_session` HMAC-SHA256 cookies. |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Production | Canonical HTTPS URL of the deployed application (e.g. `https://jetfood-polman.vercel.app`). |
| `NEXT_PUBLIC_TIMEZONE` | Public (Client + Server) | Production / Preview | Must be `Asia/Makassar` (WITA / UTC+8) for accurate daily attendance and operational reporting cutoffs in Polewali Mandar. |
| `NEXT_PUBLIC_REGION_API_BASE_URL` | Public (Client + Server) | Production / Preview | `https://emsifa.github.io/api-wilayah-indonesia/api` (Upstream Indonesian administrative region dataset endpoint; [`src/lib/region/providers/emsifa.ts`](../src/lib/region/providers/emsifa.ts) enforces an authoritative 4-Kecamatan / 31-Desa/Kelurahan resolution for Polman `7602` with offline fallback). |

### Secret Handling Verification
- [x] `.gitignore` excludes `.env*` (while permitting `!.env.example`).
- [x] `.env.example` contains only safe placeholder strings (`your-project-ref`, `your-supabase-anon-key-here`, `your-supabase-service-role-key-here`, `your-64-char-random-hmac-session-secret-here`).
- [x] `src/lib/supabase/admin.ts` enforces `import "server-only"` on line 1.
- [x] Zero hardcoded credentials or real JWT tokens exist in `src/`.

---

## 2. Database Migration Checklist

All schema, seed, and security migrations are located in `supabase/` and must be applied in strict chronological order:

1. **`supabase/migrations/20261002000000_initial_schema.sql`**
   - Creates custom enums `public.user_role` (`'ADMIN'`, `'KURIR'`) and `public.courier_status` (`'ACTIVE'`, `'INACTIVE'`).
   - Creates 5 core tables in `public`:
     - `public.profiles` (`id` references `auth.users(id) ON DELETE CASCADE`, unique `email`, `role`, `is_active`)
     - `public.couriers` (`user_id` references `public.profiles(id) ON DELETE RESTRICT`, unique `courier_code`, `vehicle_type`, `plate_number`, `status`)
     - `public.package_types` (unique `name`, `description`, `is_active`)
     - `public.attendance` (`courier_id` references `public.couriers(id) ON DELETE RESTRICT`, `attendance_courier_date_unique UNIQUE (courier_id, date)`, `attendance_clock_out_valid CHECK`)
     - `public.daily_reports` (`courier_id` references `public.couriers(id) ON DELETE RESTRICT`, `package_type_id` references `public.package_types(id) ON DELETE RESTRICT`, origin/destination region hierarchy, 6 positive numeric `CHECK` constraints, `daily_reports_route_not_identical CHECK (origin_village_id <> dest_village_id)`)
   - Creates `handle_updated_at()` triggers and all **15 performance & analytical composite indexes** (`idx_profiles_role`, `idx_profiles_is_active`, `idx_couriers_user_id`, `idx_couriers_status`, `idx_couriers_code`, `idx_package_types_active`, `idx_attendance_courier_id`, `idx_attendance_date`, `idx_attendance_courier_date`, `idx_daily_reports_courier_id`, `idx_daily_reports_date`, `idx_daily_reports_package_type_id`, `idx_daily_reports_courier_date`, `idx_daily_reports_route_districts`, `idx_daily_reports_route_villages`).
   - Enables Row Level Security (`ENABLE ROW LEVEL SECURITY`) on all 5 tables and creates `SECURITY DEFINER` helpers `public.is_admin()` and `public.get_auth_courier_id()` with `SET search_path = public`.

2. **`supabase/migrations/20261003000000_security_rls_hardening.sql`**
   - Hardens `public.get_auth_courier_id()` to verify both `c.status = 'ACTIVE'` and `p.is_active = true` with `p.role = 'KURIR'`.
   - Creates `BEFORE UPDATE` trigger `trigger_prevent_profile_privilege_escalation` (`public.prevent_profile_privilege_escalation()`) blocking non-admins from mutating `role`, `is_active`, or `email`.
   - Removes courier self-update policy on `public.profiles` (enforcing Admin-only account management).
   - Enforces WITA (`(now() AT TIME ZONE 'Asia/Makassar')::date`) same-day operational locks on courier `attendance` and `daily_reports` `INSERT`/`UPDATE` RLS policies.

3. **`supabase/seed.sql`** *(Optional / Initial Master Data)*
   - Idempotently seeds default `public.package_types` (`Makanan & Minuman (JetFood)`, `Belanja Harian / Sembako`, `Dokumen & Surat Penting`, `Barang Retail / Olshop`, `Lainnya`).

---

## 3. Supabase Setup Checklist

- [ ] **Project Configuration**
  - Create a dedicated production Supabase project in **Southeast Asia (Singapore / `ap-southeast-1`)** for optimal latency to Sulawesi Barat.
  - Record Project URL, `anon` public key, and `service_role` secret key.
- [ ] **Database Migration Execution**
  - Run `supabase link --project-ref <production-project-ref>` and `supabase db push` (or execute `20261002000000_initial_schema.sql`, `20261003000000_security_rls_hardening.sql`, and `seed.sql` in order via Supabase SQL Editor).
  - Verify all 5 tables (`profiles`, `couriers`, `package_types`, `attendance`, `daily_reports`) exist in `public` with `rowsecurity = true`.
- [ ] **Authentication Configuration**
  - Enable **Email Provider** under Authentication → Providers.
  - Disable "Confirm email" (courier accounts are provisioned internally by Admin via `supabase.auth.admin.createUser({ email_confirm: true })`).
  - Set **Site URL** to `NEXT_PUBLIC_APP_URL`.
- [ ] **Initial Admin Provisioning**
  - Create the initial Admin user in Supabase Auth (`auth.users`) and insert the corresponding row into `public.profiles` with `role = 'ADMIN'` and `is_active = true`.
- [ ] **RLS & API Verification**
  - Confirm `anon` role cannot read `profiles`, `couriers`, `attendance`, or `daily_reports` without a valid JWT.
  - Confirm `authenticated` `KURIR` JWT cannot read or mutate another courier's rows or past-date records.

---

## 4. Vercel Setup Checklist

- [ ] **Repository & Framework Configuration**
  - Framework Preset: **Next.js** (App Router, Next.js 16.3.8).
  - Node.js Version: **20.x LTS** (or 22.x LTS).
  - Root Directory: `./`
- [ ] **Build & Output Settings**
  - Install Command: `npm ci` (or `npm install`)
  - Build Command: `npm run build` (`next build`)
  - Output Directory: `.next` (Default Next.js output)
- [ ] **Environment Variables**
  - Add all 7 variables from the **Environment Variable Checklist** above to the **Production** environment in Vercel.
  - Ensure `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` are marked as sensitive/encrypted in Vercel settings.
- [ ] **Deployment & Edge Runtime Requirements**
  - Verify `src/proxy.ts` (Next.js 16 Proxy convention) compiles cleanly and enforces Web Crypto HMAC-SHA256 verification and Supabase session refresh on protected `/admin/*` and `/courier/*` routes.

---

## 5. Deployment Checklist (Pre-Flight to Post-Flight)

1. **Pre-Flight Local Verification**
   - [x] `npm run lint` passes with 0 warnings and 0 errors.
   - [x] `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
   - [x] `npm test` (Phase 11 Security + Phase 12 Full QA + Phase 13 Readiness) passes 100%.
   - [x] `npm run build` completes cleanly on localhost.
2. **Database & Auth Readiness**
   - [ ] Production Supabase migrations (`20261002000000_initial_schema.sql` & `20261003000000_security_rls_hardening.sql`) applied and verified.
   - [ ] Initial Admin user created in `auth.users` and `public.profiles`.
3. **Release Execution (Phase 14+ Only)**
   - [ ] Push verified release branch to remote repository connected to Vercel.
   - [ ] Monitor Vercel build logs to completion.
4. **Post-Deployment Smoke Test (Phase 14+ Only)**
   - [ ] Verify `/login` loads over HTTPS.
   - [ ] Verify unauthenticated access to `/admin/dashboard` and `/courier/dashboard` redirects to `/login`.
   - [ ] Verify Admin login, Courier creation, Courier login, Attendance clock-in, and Daily Report submission.

---

## 6. Rollback Considerations

### Application Rollback (Vercel Instant Rollback)
- If a front-end, Server Action, or routing regression is detected after deployment:
  1. Open **Vercel Dashboard → Deployments**.
  2. Locate the last known healthy production deployment.
  3. Click **Instant Rollback** to restore traffic immediately (< 5 seconds) without rebuilding.

### Database & RLS Rollback (Supabase)
- **Point-in-Time / Daily Backups:** Ensure Supabase automated backups are active before applying schema changes.
- **Additive vs. Destructive Changes:** All migrations in `supabase/migrations/` use `IF NOT EXISTS` and `DROP POLICY IF EXISTS` so policies and triggers can be re-applied idempotently.
- **Emergency Access Lockdown:** If an Auth or RLS anomaly is suspected in production, immediately rotate `SESSION_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables and redeploy/rollback to invalidate all active cookies.
- **Schema Reversion SQL (Emergency Only):**
  - To revert `20261003000000_security_rls_hardening.sql` trigger changes without losing data:
    ```sql
    DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON public.profiles;
    DROP FUNCTION IF EXISTS public.prevent_profile_privilege_escalation();
    ```
  - Never run `DROP TABLE` on production tables (`profiles`, `couriers`, `package_types`, `attendance`, `daily_reports`) during a rollback; always preserve operational records.
