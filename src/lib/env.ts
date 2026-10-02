/**
 * Environment Variable Helper & Validation
 * Provides typed and safe access to application environment variables.
 */

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    timezone: process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Makassar",
  },
  regionApi: {
    baseUrl:
      process.env.NEXT_PUBLIC_REGION_API_BASE_URL ||
      "https://emsifa.github.io/api-wilayah-indonesia/api",
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};

/**
 * Validate presence of essential client-side Supabase env vars
 */
export function validatePublicEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!env.supabase.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabase.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return {
    valid: missing.length === 0,
    missing,
  };
}
