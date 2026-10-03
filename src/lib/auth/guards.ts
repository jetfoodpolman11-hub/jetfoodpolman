import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession, type CurrentSessionData } from "./session";
import { ROLES } from "@/lib/constants";

/**
 * Sanitizes redirect target path to prevent Open Redirect attacks (e.g. //evil.com, /\evil.com, https://evil.com).
 * Only permits clean internal relative paths starting with a single '/'.
 */
export function sanitizeRedirectPath(
  rawPath?: string | null,
  fallback = "/"
): string {
  if (!rawPath || typeof rawPath !== "string") {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /[\r\n\t]/.test(trimmed) ||
    trimmed.includes("://")
  ) {
    return fallback;
  }

  return trimmed;
}

/**
 * Ensures the user has an active session.
 * If not authenticated, redirects to /.
 */
export async function requireAuth(redirectTo?: string): Promise<CurrentSessionData> {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    const safeRedirect = redirectTo ? sanitizeRedirectPath(redirectTo, "") : "";
    const loginPath = safeRedirect
      ? `/?redirectTo=${encodeURIComponent(safeRedirect)}`
      : "/";
    redirect(loginPath);
  }

  if (!session.profile || !session.profile.isActive) {
    redirect("/?error=account_deactivated");
  }

  return session;
}

/**
 * Authoritative Server-side Guard for ADMIN role.
 * - If not authenticated -> redirects to /admin/login
 * - If logged in as KURIR -> redirects to /courier/dashboard
 * - If account deactivated -> redirects to /admin/login?error=account_deactivated
 */
export async function requireAdmin(): Promise<CurrentSessionData> {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/admin/login");
  }

  if (session.profile && !session.profile.isActive) {
    redirect("/admin/login?error=account_deactivated");
  }

  if (!session.profile || session.profile.role !== ROLES.ADMIN) {
    // Kurir attempting to access admin route is bounced back to courier dashboard
    redirect("/courier/dashboard");
  }

  return session;
}

/**
 * Authoritative Server-side Guard for KURIR role.
 * - If not authenticated -> redirects to / (Courier Login)
 * - If logged in as ADMIN -> redirects to /admin/dashboard
 * - If courier profile missing or inactive -> redirects to /
 */
export async function requireCourier(): Promise<CurrentSessionData> {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/");
  }

  if (session.profile && !session.profile.isActive) {
    redirect("/?error=account_deactivated");
  }

  if (!session.profile || session.profile.role !== ROLES.KURIR) {
    redirect("/admin/dashboard");
  }

  if (!session.courier || !session.courier.id) {
    redirect("/?error=courier_profile_missing");
  }

  return session;
}
