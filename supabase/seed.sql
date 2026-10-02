-- ==============================================================================
-- JETFOOD POLMAN — SEED DATA
-- Description: Initial seed data for package types and administrative references
-- ==============================================================================

-- 1. SEED: DEFAULT PACKAGE TYPES (JENIS PAKET)
INSERT INTO public.package_types (name, description, is_active)
VALUES 
  ('Reguler', 'Paket pengiriman standar dalam kota / antar kecamatan', true),
  ('Express', 'Pengiriman cepat prioritas hari yang sama (same-day delivery)', true),
  ('Dokumen', 'Pengiriman surat penting, arsip dinas, berkas kantor', true),
  ('Cargo', 'Pengiriman barang dimensi besar atau muatan berat', true),
  ('Makanan & Minuman', 'Pengantaran kuliner / pesanan konsumsi fresh', true)
ON CONFLICT (name) DO NOTHING;

-- 2. NOTE: INITIAL ADMIN USER CREATION
-- Untuk membuat akun admin pertama pada Supabase:
-- Jalankan melalui Supabase Auth Dashboard atau gunakan script psql:
-- 
-- DO $$
-- DECLARE
--   admin_user_id uuid := gen_random_uuid();
-- BEGIN
--   -- Insert ke auth.users (dilakukan via Supabase Auth API/Dashboard di production)
--   -- Insert ke public.profiles:
--   -- INSERT INTO public.profiles (id, role, full_name, email, is_active)
--   -- VALUES (admin_user_id, 'ADMIN', 'Super Admin JetFood', 'admin@jetfoodpolman.com', true);
-- END $$;
