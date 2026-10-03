-- ==============================================================================
-- JETFOOD POLMAN — PHASE 11 SECURITY & RLS HARDENING MIGRATION
-- Migration: 20261003000000_security_rls_hardening.sql
-- Description:
-- 1. Hardens public.get_auth_courier_id() to verify ACTIVE courier & profile status.
-- 2. Removes courier self-update on public.profiles and adds anti-escalation trigger.
-- 3. Enforces WITA same-day operational date locks on attendance & daily_reports RLS.
-- ==============================================================================

-- 1. Harden get_auth_courier_id() to require ACTIVE courier and active KURIR profile
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

-- 2. Defense-in-depth trigger preventing non-admin role/status/email escalation
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

-- 3. Remove courier self-update policy on profiles (Admin-only account management)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 4. Enforce WITA same-day constraint on Courier Attendance INSERT & UPDATE policies
DROP POLICY IF EXISTS "Couriers can clock in" ON public.attendance;
CREATE POLICY "Couriers can clock in"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

DROP POLICY IF EXISTS "Couriers can clock out" ON public.attendance;
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

-- 5. Enforce WITA same-day constraint on Courier Daily Reports INSERT & UPDATE policies
DROP POLICY IF EXISTS "Couriers can insert own daily reports" ON public.daily_reports;
CREATE POLICY "Couriers can insert own daily reports"
  ON public.daily_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    courier_id = public.get_auth_courier_id()
    AND date = (now() AT TIME ZONE 'Asia/Makassar')::date
  );

DROP POLICY IF EXISTS "Couriers can update own daily reports" ON public.daily_reports;
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
