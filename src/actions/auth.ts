"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLoginInput } from "@/lib/validations/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";
import { signMockSession } from "@/lib/auth/cookie-signer";
import { sanitizeRedirectPath } from "@/lib/auth/guards";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

const ALLOWED_DEMO_COURIERS: Record<
  string,
  { name: string; email: string; isActive: boolean }
> = {
  "JF-001": {
    name: "Kurir Lapangan Ali",
    email: "kurir@jetfoodpolman.com",
    isActive: true,
  },
  "JF-002": {
    name: "Kurir Lapangan Budi",
    email: "budi@jetfoodpolman.com",
    isActive: true,
  },
  "JF-003": {
    name: "Kurir Lapangan Citra",
    email: "citra@jetfoodpolman.com",
    isActive: true,
  },
};

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

  // 2. Local Demo / Placeholder Mode Authentication (Strict password & signature check)
  if (isPlaceholderEnv) {
    if (!rawIdentifier.includes("@")) {
      const code = rawIdentifier.toUpperCase();
      const demoCourier = ALLOWED_DEMO_COURIERS[code];

      if (!demoCourier) {
        return {
          success: false,
          error: `Kode kurir "${code}" tidak terdaftar dalam sistem.`,
        };
      }

      if (!demoCourier.isActive) {
        return {
          success: false,
          error: "Status akun kurir Anda sedang dinonaktifkan oleh administrator.",
        };
      }

      if (password !== "kurir123") {
        return {
          success: false,
          error: "Kredensial atau kata sandi tidak sesuai.",
        };
      }

      setSignedSessionCookies(cookieStore, {
        role: "KURIR",
        email: demoCourier.email,
        name: demoCourier.name,
        code,
      });

      return {
        success: true,
        redirectTo: resolveRoleSafeRedirect("KURIR", explicitRedirect),
      };
    }

    const email = rawIdentifier.toLowerCase();
    if (email === "admin@jetfoodpolman.com") {
      if (password !== "admin123") {
        return {
          success: false,
          error: "Kredensial atau kata sandi tidak sesuai.",
        };
      }

      setSignedSessionCookies(cookieStore, {
        role: "ADMIN",
        email: "admin@jetfoodpolman.com",
        name: "Super Admin JetFood",
      });

      return {
        success: true,
        redirectTo: resolveRoleSafeRedirect("ADMIN", explicitRedirect),
      };
    }

    const matchedCourierEntry = Object.entries(ALLOWED_DEMO_COURIERS).find(
      ([, info]) => info.email.toLowerCase() === email
    );

    if (matchedCourierEntry || email === "ali@jetfoodpolman.com") {
      if (password !== "kurir123") {
        return {
          success: false,
          error: "Kredensial atau kata sandi tidak sesuai.",
        };
      }

      const [code, info] = matchedCourierEntry || [
        "JF-001",
        ALLOWED_DEMO_COURIERS["JF-001"],
      ];

      setSignedSessionCookies(cookieStore, {
        role: "KURIR",
        email: info.email,
        name: info.name,
        code,
      });

      return {
        success: true,
        redirectTo: resolveRoleSafeRedirect("KURIR", explicitRedirect),
      };
    }

    return {
      success: false,
      error: "Kredensial atau kata sandi tidak sesuai.",
    };
  }

  // 3. Supabase Auth Authentication
  const supabase = await createClient();
  let authEmail = rawIdentifier.toLowerCase();

  // Resolve Courier Code to Email if identifier is not an email
  if (!rawIdentifier.includes("@")) {
    const cleanCode = rawIdentifier.toUpperCase();
    if (!/^JF-\d{3,6}$/.test(cleanCode)) {
      return {
        success: false,
        error: "Format kode kurir tidak valid (contoh: JF-001).",
      };
    }

    const { data: courierRecord, error: courierErr } = await supabase
      .from("couriers")
      .select("id, courier_code, status, profiles:user_id ( id, email, is_active, full_name )")
      .eq("courier_code", cleanCode)
      .maybeSingle();

    if (courierErr || !courierRecord) {
      return {
        success: false,
        error: `Kode kurir "${cleanCode}" tidak terdaftar dalam sistem.`,
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

  // 6. Determine destination path safely
  const targetRedirect = resolveRoleSafeRedirect(profile.role, explicitRedirect);

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
  if (!courierCode || typeof courierCode !== "string" || !courierCode.trim()) {
    return { success: false, error: "Kode kurir biometrik tidak valid." };
  }

  const cleanCode = courierCode.trim().toUpperCase();
  if (!/^JF-\d{3,6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Format ID / Kode Kurir tidak valid (contoh: JF-001).",
    };
  }

  const cookieStore = await cookies();

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const demoCourier = ALLOWED_DEMO_COURIERS[cleanCode];
    if (!demoCourier) {
      return {
        success: false,
        error: `Kode kurir "${cleanCode}" tidak terdaftar di sistem.`,
      };
    }

    setSignedSessionCookies(cookieStore, {
      role: "KURIR",
      email: demoCourier.email,
      name: demoCourier.name,
      code: cleanCode,
    });

    return { success: true, redirectTo: "/courier/dashboard" };
  }

  const supabase = await createClient();
  const { data: courierRec, error: fetchErr } = await supabase
    .from("couriers")
    .select("id, courier_code, status, profiles:user_id ( id, email, is_active, full_name )")
    .eq("courier_code", cleanCode)
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

  setSignedSessionCookies(cookieStore, {
    role: "KURIR",
    email: prof.email,
    name: prof.full_name,
    code: courierRec.courier_code,
  });

  return { success: true, redirectTo: "/courier/dashboard" };
}

/**
 * Server Action: Direct Login using Courier ID / Code
 * Enables courier to enter work dashboard directly using their official courier code
 */
export async function loginCourierByIdAction(
  courierCode: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  if (!courierCode || typeof courierCode !== "string" || !courierCode.trim()) {
    return { success: false, error: "Silakan masukkan ID / Kode Kurir Anda." };
  }

  const cleanCode = courierCode.trim().toUpperCase();
  if (!/^JF-\d{3,6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Format ID / Kode Kurir tidak valid (contoh: JF-001).",
    };
  }

  const cookieStore = await cookies();
  const target = resolveRoleSafeRedirect("KURIR", redirectTo);

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholderEnv) {
    const demoCourier = ALLOWED_DEMO_COURIERS[cleanCode];
    if (!demoCourier) {
      return {
        success: false,
        error: `Kode kurir "${cleanCode}" tidak ditemukan di sistem.`,
      };
    }

    setSignedSessionCookies(cookieStore, {
      role: "KURIR",
      email: demoCourier.email,
      name: demoCourier.name,
      code: cleanCode,
    });

    return { success: true, redirectTo: target };
  }

  const supabase = await createClient();
  const { data: courierRec, error: fetchErr } = await supabase
    .from("couriers")
    .select("id, courier_code, status, profiles:user_id ( id, email, is_active, full_name )")
    .eq("courier_code", cleanCode)
    .maybeSingle();

  if (fetchErr || !courierRec) {
    return { success: false, error: `Kode kurir "${cleanCode}" tidak ditemukan di sistem.` };
  }

  if (courierRec.status !== "ACTIVE") {
    return { success: false, error: "Akun kurir ini sedang dinonaktifkan oleh administrator." };
  }

  const prof = Array.isArray(courierRec.profiles)
    ? courierRec.profiles[0]
    : courierRec.profiles;

  if (!prof || !prof.is_active) {
    return { success: false, error: "Akun profil kurir tidak aktif." };
  }

  setSignedSessionCookies(cookieStore, {
    role: "KURIR",
    email: prof.email,
    name: prof.full_name,
    code: courierRec.courier_code,
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
