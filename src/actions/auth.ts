"use server";

import { redirect } from "next/navigation";
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
 * Server Action: Authenticate user using Supabase Auth
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
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

  // 2. Supabase Auth Authentication
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
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

  // 3. Fetch user profile from database to determine role and active status
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

  // 4. Check if account is active
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.",
    };
  }

  // 5. Determine destination path
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
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
