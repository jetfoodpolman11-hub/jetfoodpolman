-- ==============================================================================
-- JETFOOD POLMAN — DATABASE INITIAL SCHEMA MIGRATION
-- Migration: 20261002000000_initial_schema.sql
-- Description: Core tables, constraints, indexes, triggers, and RLS policies
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('ADMIN', 'KURIR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.courier_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TRIGGER FUNCTION: AUTO UPDATE UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLE: PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'KURIR',
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. TABLE: COURIERS (Courier Metadata Linked to Profile)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  courier_code text NOT NULL UNIQUE,
  vehicle_type text,
  plate_number text,
  status public.courier_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for couriers
DROP TRIGGER IF EXISTS trigger_couriers_updated_at ON public.couriers;
CREATE TRIGGER trigger_couriers_updated_at
  BEFORE UPDATE ON public.couriers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. TABLE: PACKAGE_TYPES (Managed by Admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.package_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for package_types
DROP TRIGGER IF EXISTS trigger_package_types_updated_at ON public.package_types;
CREATE TRIGGER trigger_package_types_updated_at
  BEFORE UPDATE ON public.package_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. TABLE: ATTENDANCE (Courier Daily Clock-in / Clock-out)
-- Timezone note: Date represents the operational calendar day in WITA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES public.couriers(id) ON DELETE RESTRICT,
  date date NOT NULL,
  clock_in_time timestamptz NOT NULL DEFAULT now(),
  clock_out_time timestamptz,
  clock_in_notes text,
  clock_out_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints:
  -- Prevent multiple clock-ins per courier on the same date
  CONSTRAINT attendance_courier_date_unique UNIQUE (courier_id, date),
  -- Ensure clock-out time is not earlier than clock-in time
  CONSTRAINT attendance_clock_out_valid CHECK (
    clock_out_time IS NULL OR clock_out_time >= clock_in_time
  )
);

-- Trigger for attendance
DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance;
CREATE TRIGGER trigger_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. TABLE: DAILY_REPORTS (Operational Reports Submitted by Couriers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES public.couriers(id) ON DELETE RESTRICT,
  date date NOT NULL,
  package_type_id uuid NOT NULL REFERENCES public.package_types(id) ON DELETE RESTRICT,

  -- Departure Region (Wilayah Keberangkatan)
  origin_province_id text NOT NULL,
  origin_province_name text NOT NULL,
  origin_regency_id text NOT NULL,
  origin_regency_name text NOT NULL,
  origin_district_id text NOT NULL,
  origin_district_name text NOT NULL,
  origin_village_id text NOT NULL,
  origin_village_name text NOT NULL,

  -- Destination Region (Wilayah Tujuan)
  dest_province_id text NOT NULL,
  dest_province_name text NOT NULL,
  dest_regency_id text NOT NULL,
  dest_regency_name text NOT NULL,
  dest_district_id text NOT NULL,
  dest_district_name text NOT NULL,
  dest_village_id text NOT NULL,
  dest_village_name text NOT NULL,

  -- Operational Metrics
  order_count integer NOT NULL DEFAULT 0,
  omset numeric(12, 2) NOT NULL DEFAULT 0.00,
  ojol_count integer NOT NULL DEFAULT 0,
  ojol_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  jastip_count integer NOT NULL DEFAULT 0,
  jastip_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Business Rule Constraints:
  -- 1. Non-negative numeric metrics
  CONSTRAINT daily_reports_order_count_positive CHECK (order_count >= 0),
  CONSTRAINT daily_reports_omset_positive CHECK (omset >= 0.00),
  CONSTRAINT daily_reports_ojol_count_positive CHECK (ojol_count >= 0),
  CONSTRAINT daily_reports_ojol_amount_positive CHECK (ojol_amount >= 0.00),
  CONSTRAINT daily_reports_jastip_count_positive CHECK (jastip_count >= 0),
  CONSTRAINT daily_reports_jastip_amount_positive CHECK (jastip_amount >= 0.00),

  -- 2. Departure and Destination must not be identical at village level
  CONSTRAINT daily_reports_route_not_identical CHECK (origin_village_id <> dest_village_id)
);

-- Trigger for daily_reports
DROP TRIGGER IF EXISTS trigger_daily_reports_updated_at ON public.daily_reports;
CREATE TRIGGER trigger_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. INDEXING STRATEGY
-- ==============================================================================
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Couriers
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON public.couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON public.couriers(status);
CREATE INDEX IF NOT EXISTS idx_couriers_code ON public.couriers(courier_code);

-- Package Types
CREATE INDEX IF NOT EXISTS idx_package_types_active ON public.package_types(is_active);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_courier_id ON public.attendance(courier_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_courier_date ON public.attendance(courier_id, date);

-- Daily Reports
CREATE INDEX IF NOT EXISTS idx_daily_reports_courier_id ON public.daily_reports(courier_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_package_type_id ON public.daily_reports(package_type_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_courier_date ON public.daily_reports(courier_id, date);

-- Route analytics composite indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_route_districts 
  ON public.daily_reports(origin_district_name, dest_district_name);

CREATE INDEX IF NOT EXISTS idx_daily_reports_route_villages 
  ON public.daily_reports(origin_village_name, dest_village_name);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================

-- Security definer helper functions to safely evaluate auth user context without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'ADMIN' FROM public.profiles WHERE id = auth.uid() AND is_active = true),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_courier_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.couriers c
  INNER JOIN public.profiles p ON p.id = c.user_id
  WHERE c.user_id = auth.uid()
    AND c.status = 'ACTIVE'
    AND p.is_active = true
    AND p.role = 'KURIR';
$$;

-- Trigger to strictly prevent non-admin privilege escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Privilege escalation denied: only ADMIN can modify role, active status, or email.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: PROFILES
-- ------------------------------------------------------------------------------
-- Admin has full access
CREATE POLICY "Admin full access on profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User can view own profile (Read-only for Couriers; profile management is Admin-only)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: COURIERS
-- ------------------------------------------------------------------------------
-- Admin has full access
CREATE POLICY "Admin full access on couriers"
  ON public.couriers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Courier can view their own courier metadata
CREATE POLICY "Couriers can view own courier metadata"
  ON public.couriers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: PACKAGE_TYPES
-- ------------------------------------------------------------------------------
-- Admin can manage package types
CREATE POLICY "Admin full access on package_types"
  ON public.package_types
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Authenticated couriers can read active package types
CREATE POLICY "Authenticated users can read active package types"
  ON public.package_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: ATTENDANCE
-- ------------------------------------------------------------------------------
-- Admin has full access (view, filter, rekap, correct)
CREATE POLICY "Admin full access on attendance"
  ON public.attendance
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Courier can view their own attendance
CREATE POLICY "Couriers can view own attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (courier_id = public.get_auth_courier_id());

-- Courier can insert their own clock-in on the current WITA operational date
CREATE POLICY "Couriers can clock in"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

-- Courier can update their own clock-out on the current WITA operational date
CREATE POLICY "Couriers can clock out"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  )
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DAILY_REPORTS
-- ------------------------------------------------------------------------------
-- Admin has full access (view, filter, edit, delete, rekap)
CREATE POLICY "Admin full access on daily_reports"
  ON public.daily_reports
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Courier can view their own daily reports
CREATE POLICY "Couriers can view own daily reports"
  ON public.daily_reports
  FOR SELECT
  TO authenticated
  USING (courier_id = public.get_auth_courier_id());

-- Courier can insert their own daily operational report on the current WITA operational date
CREATE POLICY "Couriers can insert own daily reports"
  ON public.daily_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

-- Courier can update their own report on the same WITA operational date
CREATE POLICY "Couriers can update own daily reports"
  ON public.daily_reports
  FOR UPDATE
  TO authenticated
  USING (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  )
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

-- Note: Couriers are strictly NOT granted DELETE permission on daily_reports or attendance.
