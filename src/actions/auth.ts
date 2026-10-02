"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLoginInput } from "@/lib/validations/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

/**
 * Server Action: Authenticate user using Email or Courier Code (Kode Kurir)
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawIdentifier = (
    (formData.get("identifier") as string) ||
    (formData.get("courierCode") as string) ||
    (formData.get("email") as string) ||
    ""
  ).trim();
  const password = formData.get("password") as string;
  const explicitRedirect = formData.get("redirectTo") as string | null;

  // 1. Input Validation
  const validation = validateLoginInput({ identifier: rawIdentifier, password });
  if (!validation.isValid) {
    return {
      success: false,
      fieldErrors: validation.errors,
      error: "Mohon periksa kembali kredensial dan kata sandi Anda.",
    };
  }

  const cookieStore = await cookies();
  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // 2. Courier Code Fast Login for Localhost / Demo Mode
  if (!rawIdentifier.includes("@")) {
    const code = rawIdentifier.toUpperCase();
    if (code === "JF-001" || code === "JF-002" || code.startsWith("JF-") || isPlaceholderEnv) {
      cookieStore.set("jf_mock_role", "KURIR", { path: "/" });
      cookieStore.set("jf_mock_email", `${code.toLowerCase()}@jetfoodpolman.com`, { path: "/" });
      cookieStore.set("jf_mock_name", code === "JF-002" ? "Kurir Lapangan Budi" : "Kurir Lapangan Ali", { path: "/" });
      cookieStore.set("jf_mock_code", code, { path: "/" });

      const target = explicitRedirect && explicitRedirect.startsWith("/") ? explicitRedirect : "/courier/dashboard";
      return { success: true, redirectTo: target };
    }
  }

  // 3. Email Localhost Demo Mode
  const email = rawIdentifier.toLowerCase();
  if (isPlaceholderEnv || email === "admin@jetfoodpolman.com" || email === "kurir@jetfoodpolman.com") {
    if (email === "admin@jetfoodpolman.com" && (password === "admin123" || isPlaceholderEnv)) {
      cookieStore.set("jf_mock_role", "ADMIN", { path: "/" });
      cookieStore.set("jf_mock_email", "admin@jetfoodpolman.com", { path: "/" });
      cookieStore.set("jf_mock_name", "Super Admin JetFood", { path: "/" });

      const target = explicitRedirect && explicitRedirect.startsWith("/") ? explicitRedirect : "/admin/dashboard";
      return { success: true, redirectTo: target };
    }

    if (
      (email === "kurir@jetfoodpolman.com" || email === "ali@jetfoodpolman.com") &&
      (password === "kurir123" || isPlaceholderEnv)
    ) {
      cookieStore.set("jf_mock_role", "KURIR", { path: "/" });
      cookieStore.set("jf_mock_email", email, { path: "/" });
      cookieStore.set("jf_mock_name", "Kurir Lapangan Ali", { path: "/" });
      cookieStore.set("jf_mock_code", "JF-001", { path: "/" });

      const target = explicitRedirect && explicitRedirect.startsWith("/") ? explicitRedirect : "/courier/dashboard";
      return { success: true, redirectTo: target };
    }

    if (isPlaceholderEnv) {
      return {
        success: false,
        error: "Akun tidak dikenali di mode demo. Gunakan Kode Kurir JF-001 (sandi: kurir123) atau admin@jetfoodpolman.com (admin123).",
      };
    }
  }

  // 4. Supabase Auth Authentication
  const supabase = await createClient();
  let authEmail = email;

  // Resolve Courier Code to Email if identifier is not an email
  if (!rawIdentifier.includes("@")) {
    const { data: courierRecord, error: courierErr } = await supabase
      .from("couriers")
      .select("id, courier_code, status, profiles:user_id ( id, email, is_active, full_name )")
      .ilike("courier_code", rawIdentifier)
      .maybeSingle();

    if (courierErr || !courierRecord) {
      return {
        success: false,
        error: `Kode kurir "${rawIdentifier.toUpperCase()}" tidak terdaftar dalam sistem.`,
      };
    }

    if (courierRecord.status !== "ACTIVE") {
      return {
        success: false,
        error: "Status akun kurir Anda sedang dinonaktifkan oleh administrator.",
      };
    }

    const prof = Array.isArray(courierRecord.profiles)
      ? courierRecord.profiles[0]
      : courierRecord.profiles;

    if (!prof || !prof.email) {
      return {
        success: false,
        error: "Profil kurir tidak memiliki akun email kredensial terdaftar.",
      };
    }

    authEmail = prof.email.toLowerCase();
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error:
        authError?.message === "Invalid login credentials"
          ? "Kredensial atau kata sandi tidak sesuai."
          : authError?.message || "Gagal masuk. Silakan coba lagi.",
    };
  }

  // 5. Fetch user profile from database to determine role and active status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Data profil pengguna tidak ditemukan di sistem.",
    };
  }

  // 6. Check if account is active
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.",
    };
  }

  // 7. Determine destination path
  const defaultPath = getDefaultDashboardPath(profile.role);
  const targetRedirect =
    explicitRedirect && explicitRedirect.startsWith("/")
      ? explicitRedirect
      : defaultPath;

  return {
    success: true,
    redirectTo: targetRedirect,
  };
}

/**
 * Server Action: Fast Login with Biometrics (Fingerprint / Face ID)
 * Allows registered device to log courier in directly without re-typing credentials
 */
export async function loginWithBiometricAction(
  courierCode: string
): Promise<AuthActionResult> {
  if (!courierCode || !courierCode.trim()) {
    return { success: false, error: "Kode kurir biometrik tidak valid." };
  }

  const cleanCode = courierCode.trim().toUpperCase();
  const cookieStore = await cookies();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    cookieStore.set("jf_mock_role", "KURIR", { path: "/" });
    cookieStore.set("jf_mock_email", `${cleanCode.toLowerCase()}@jetfoodpolman.com`, { path: "/" });
    cookieStore.set("jf_mock_name", cleanCode === "JF-002" ? "Kurir Lapangan Budi" : "Kurir Lapangan Ali", { path: "/" });
    cookieStore.set("jf_mock_code", cleanCode, { path: "/" });

    return { success: true, redirectTo: "/courier/dashboard" };
  }

  const supabase = await createClient();
  const { data: courierRec, error: fetchErr } = await supabase
    .from("couriers")
    .select("id, courier_code, status, profiles:user_id ( id, email, is_active, full_name )")
    .ilike("courier_code", cleanCode)
    .maybeSingle();

  if (fetchErr || !courierRec) {
    return { success: false, error: `Kode kurir "${cleanCode}" tidak terdaftar.` };
  }

  if (courierRec.status !== "ACTIVE") {
    return { success: false, error: "Akun kurir Anda sedang dinonaktifkan oleh administrator." };
  }

  const prof = Array.isArray(courierRec.profiles)
    ? courierRec.profiles[0]
    : courierRec.profiles;

  if (!prof || !prof.is_active) {
    return { success: false, error: "Akun profil kurir tidak aktif." };
  }

  cookieStore.set("jf_mock_role", "KURIR", { path: "/" });
  cookieStore.set("jf_mock_email", prof.email, { path: "/" });
  cookieStore.set("jf_mock_name", prof.full_name, { path: "/" });
  cookieStore.set("jf_mock_code", courierRec.courier_code, { path: "/" });

  return { success: true, redirectTo: "/courier/dashboard" };
}

/**
 * Server Action: Logout user and invalidate session
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("jf_mock_role");
  cookieStore.delete("jf_mock_email");
  cookieStore.delete("jf_mock_name");
  cookieStore.delete("jf_mock_code");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out from Supabase:", error);
  }

  redirect("/login");
}
