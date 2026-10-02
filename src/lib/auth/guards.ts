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
 * - If courier profile missing -> throws or redirects
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

  return session;
}
