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
 * Server Action: Authenticate user using Supabase Auth (with local Demo mode support)
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const explicitRedirect = formData.get("redirectTo") as string | null;

  // 1. Input Validation
  const validation = validateLoginInput({ email, password });
  if (!validation.isValid) {
    return {
      success: false,
      fieldErrors: validation.errors as Record<string, string>,
      error: "Mohon periksa kembali email dan password Anda.",
    };
  }

  const cookieStore = await cookies();
  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // 2. Localhost Demo Mode Interception
  // Allows immediate interactive login on localhost with demo accounts
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
        error: "Akun tidak dikenali di mode demo. Gunakan admin@jetfoodpolman.com (admin123) atau kurir@jetfoodpolman.com (kurir123).",
      };
    }
  }

  // 3. Supabase Auth Authentication (Cloud / Production / Connected Supabase)
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error:
        authError?.message === "Invalid login credentials"
          ? "Email atau kata sandi tidak sesuai."
          : authError?.message || "Gagal masuk. Silakan coba lagi.",
    };
  }

  // 4. Fetch user profile from database to determine role and active status
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

  // 5. Check if account is active
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.",
    };
  }

  // 6. Determine destination path
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
 * Server Action: Sign out the user and clear session cookies
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("jf_mock_role");
  cookieStore.delete("jf_mock_email");
  cookieStore.delete("jf_mock_name");
  cookieStore.delete("jf_mock_code");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore if client is in mock mode
  }

  redirect("/login");
}
