import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession, type CurrentSessionData } from "./session";
import { ROLES } from "@/lib/constants";

/**
 * Ensures the user has an active session.
 * If not authenticated, redirects to /login.
 */
export async function requireAuth(redirectTo?: string): Promise<CurrentSessionData> {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    const loginPath = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
    redirect(loginPath);
  }

  if (session.profile && !session.profile.isActive) {
    redirect("/login?error=account_deactivated");
  }

  return session;
}

/**
 * Authoritative Server-side Guard for ADMIN role.
 * - If not authenticated -> redirects to /login
 * - If logged in as KURIR -> redirects to /courier/dashboard (forbidden access to admin)
 * - If account deactivated -> redirects to /login?error=account_deactivated
 */
export async function requireAdmin(): Promise<CurrentSessionData> {
  const session = await requireAuth("/admin/dashboard");

  if (!session.profile || session.profile.role !== ROLES.ADMIN) {
    // Kurir attempting to access admin route is bounced back to courier dashboard
    redirect("/courier/dashboard");
  }

  return session;
}

/**
 * Authoritative Server-side Guard for KURIR role.
 * - If not authenticated -> redirects to /login
 * - If logged in as ADMIN -> redirects to /admin/dashboard
 * - If courier profile missing -> throws or redirects
 */
export async function requireCourier(): Promise<CurrentSessionData> {
  const session = await requireAuth("/courier/dashboard");

  if (!session.profile || session.profile.role !== ROLES.KURIR) {
    // Admin accessing courier space can be routed to admin dashboard
    redirect("/admin/dashboard");
  }

  return session;
}
