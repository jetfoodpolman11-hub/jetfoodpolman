"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateLoginInput } from "@/lib/validations/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";
import { signMockSession } from "@/lib/auth/cookie-signer";
import { sanitizeRedirectPath } from "@/lib/auth/guards";
import {
  fetchAllCouriersInternal,
  findCourierByCodeInternal,
} from "@/actions/couriers";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
const OFFICIAL_ADMIN_EMAIL = "jetfoodpolman11@gmail.com";
const OFFICIAL_ADMIN_PASS = "JF11112020";

function setSignedSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  params: {
    role: "ADMIN" | "KURIR";
    email: string;
    name: string;
    code?: string;
  }
) {
  const isProd = process.env.NODE_ENV === "production";
  const baseOpts = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    maxAge: COOKIE_MAX_AGE,
  };

  const normalizedCode = params.role === "KURIR" ? params.code || "JF-001" : "";
  const signature = signMockSession(params.role, normalizedCode);

  cookieStore.set("jf_mock_role", params.role, baseOpts);
  cookieStore.set("jf_mock_email", params.email, baseOpts);
  cookieStore.set("jf_mock_name", params.name, baseOpts);
  if (params.role === "KURIR") {
    cookieStore.set("jf_mock_code", normalizedCode, baseOpts);
  } else {
    cookieStore.delete("jf_mock_code");
  }
  cookieStore.set("jf_mock_sig", signature, baseOpts);
}

/**
 * Ensures role-appropriate post-login redirect target and blocks Open Redirects
 */
function resolveRoleSafeRedirect(
  role: "ADMIN" | "KURIR",
  rawRedirect?: string | null
): string {
  const defaultPath = getDefaultDashboardPath(role);
  const sanitized = sanitizeRedirectPath(rawRedirect, defaultPath);

  if (role === "KURIR" && sanitized.startsWith("/admin")) {
    return "/courier/dashboard";
  }
  if (role === "ADMIN" && sanitized.startsWith("/courier")) {
    return "/admin/dashboard";
  }
  return sanitized;
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

  // 2. Check if logging in with Courier Code (without '@')
  if (!rawIdentifier.includes("@")) {
    const cleanCode = rawIdentifier.toUpperCase();
    if (cleanCode.length < 2 || !/^[A-Z0-9][A-Z0-9-_]{1,24}$/.test(cleanCode)) {
      return {
        success: false,
        error: "Format kode kurir tidak valid (contoh: JF0001 atau JF-001).",
      };
    }

    const courier = await findCourierByCodeInternal(cleanCode);
    if (!courier) {
      return {
        success: false,
        error: `Kode kurir "${cleanCode}" belum terdaftar di sistem.`,
      };
    }

    if (courier.status !== "ACTIVE" || !courier.isActive) {
      return {
        success: false,
        error: "Status akun kurir Anda sedang dinonaktifkan oleh administrator.",
      };
    }

    if (!isPlaceholderEnv) {
      const supabase = await createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: courier.email,
        password,
      });
      if (authErr) {
        return {
          success: false,
          error: "Kata sandi kurir tidak sesuai.",
        };
      }
    }

    setSignedSessionCookies(cookieStore, {
      role: "KURIR",
      email: courier.email,
      name: courier.fullName,
      code: courier.courierCode,
    });

    return {
      success: true,
      redirectTo: resolveRoleSafeRedirect("KURIR", explicitRedirect),
    };
  }

  const authEmail = rawIdentifier.toLowerCase();

  // 3. Official Admin Login Check (jetfoodpolman11@gmail.com)
  if (authEmail === OFFICIAL_ADMIN_EMAIL) {
    if (password !== OFFICIAL_ADMIN_PASS) {
      return {
        success: false,
        error: "Email atau kata sandi administrator tidak sesuai.",
      };
    }

    if (!isPlaceholderEnv) {
      try {
        const supabase = await createClient();
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: OFFICIAL_ADMIN_EMAIL,
          password: OFFICIAL_ADMIN_PASS,
        });

        if (signInData?.user) {
          const adminClient = createAdminClient();
          await adminClient.from("profiles").upsert({
            id: signInData.user.id,
            role: "ADMIN",
            full_name: "Admin JetFood Polman",
            email: OFFICIAL_ADMIN_EMAIL,
            is_active: true,
          });
        }
      } catch {
        // Proceed with signed session cookie even if profiles table is not yet initialized
      }
    }

    setSignedSessionCookies(cookieStore, {
      role: "ADMIN",
      email: OFFICIAL_ADMIN_EMAIL,
      name: "Admin JetFood Polman",
    });

    return {
      success: true,
      redirectTo: resolveRoleSafeRedirect("ADMIN", explicitRedirect),
    };
  }

  if (isPlaceholderEnv) {
    return {
      success: false,
      error: "Email atau kata sandi tidak sesuai.",
    };
  }

  // 4. Standard Supabase Auth Authentication for other registered accounts
  const supabase = await createClient();
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

  // Check if user is a registered courier
  const allCouriers = await fetchAllCouriersInternal();
  const matchedCourier = allCouriers.find(
    (c) =>
      c.userId === authData.user.id ||
      c.email.toLowerCase() === authEmail
  );

  if (matchedCourier) {
    if (!matchedCourier.isActive || matchedCourier.status !== "ACTIVE") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Akun kurir Anda sedang dinonaktifkan oleh administrator.",
      };
    }

    setSignedSessionCookies(cookieStore, {
      role: "KURIR",
      email: matchedCourier.email,
      name: matchedCourier.fullName,
      code: matchedCourier.courierCode,
    });

    return {
      success: true,
      redirectTo: resolveRoleSafeRedirect("KURIR", explicitRedirect),
    };
  }

  // Otherwise check profiles table or user_metadata for ADMIN role
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  const metaRole = authData.user.user_metadata?.role;
  const resolvedRole: "ADMIN" | "KURIR" | null =
    profile?.role === "ADMIN" || metaRole === "ADMIN"
      ? "ADMIN"
      : profile?.role === "KURIR" || metaRole === "KURIR"
      ? "KURIR"
      : null;

  if (!resolvedRole) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Data profil pengguna tidak ditemukan di sistem.",
    };
  }

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.",
    };
  }

  setSignedSessionCookies(cookieStore, {
    role: resolvedRole,
    email: authEmail,
    name:
      profile?.full_name ||
      (authData.user.user_metadata?.full_name as string) ||
      "Pengguna JetFood",
  });

  return {
    success: true,
    redirectTo: resolveRoleSafeRedirect(resolvedRole, explicitRedirect),
  };
}

/**
 * Server Action: Fast Login with Biometrics (Fingerprint / Face ID)
 * Allows registered device to log courier in directly if courier exists and is active in Supabase
 */
export async function loginWithBiometricAction(
  courierCode: string
): Promise<AuthActionResult> {
  if (!courierCode || typeof courierCode !== "string" || !courierCode.trim()) {
    return { success: false, error: "Kode kurir biometrik tidak valid." };
  }

  const cleanCode = courierCode.trim().toUpperCase();
  if (cleanCode.length < 2 || !/^[A-Z0-9][A-Z0-9-_]{1,24}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Format ID / Kode Kurir tidak valid (contoh: JF0001 atau JF-001).",
    };
  }

  const courier = await findCourierByCodeInternal(cleanCode);
  if (!courier) {
    return {
      success: false,
      error: `Kode kurir "${cleanCode}" tidak terdaftar di sistem.`,
    };
  }

  if (courier.status !== "ACTIVE" || !courier.isActive) {
    return {
      success: false,
      error: "Akun kurir Anda sedang dinonaktifkan oleh administrator.",
    };
  }

  const cookieStore = await cookies();
  setSignedSessionCookies(cookieStore, {
    role: "KURIR",
    email: courier.email,
    name: courier.fullName,
    code: courier.courierCode,
  });

  return { success: true, redirectTo: "/courier/dashboard" };
}

/**
 * Server Action: Direct Login using Courier ID / Code
 * Verifies courier existence & active status against Supabase
 */
export async function loginCourierByIdAction(
  courierCode: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  if (!courierCode || typeof courierCode !== "string" || !courierCode.trim()) {
    return { success: false, error: "Silakan masukkan ID / Kode Kurir Anda." };
  }

  const cleanCode = courierCode.trim().toUpperCase();
  if (cleanCode.length < 2 || !/^[A-Z0-9][A-Z0-9-_]{1,24}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Format ID / Kode Kurir tidak valid (contoh: JF0001 atau JF-001).",
    };
  }

  const courier = await findCourierByCodeInternal(cleanCode);
  if (!courier) {
    return {
      success: false,
      error: `Kode kurir "${cleanCode}" belum terdaftar. Silakan buat akun kurir di Panel Admin terlebih dahulu.`,
    };
  }

  if (courier.status !== "ACTIVE" || !courier.isActive) {
    return {
      success: false,
      error: "Akun kurir ini sedang dinonaktifkan oleh administrator.",
    };
  }

  const cookieStore = await cookies();
  const target = resolveRoleSafeRedirect("KURIR", redirectTo);

  setSignedSessionCookies(cookieStore, {
    role: "KURIR",
    email: courier.email,
    name: courier.fullName,
    code: courier.courierCode,
  });

  return { success: true, redirectTo: target };
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
  cookieStore.delete("jf_mock_sig");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out from Supabase:", error);
  }

  redirect("/");
}
