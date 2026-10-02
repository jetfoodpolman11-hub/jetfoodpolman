import { ROLES, type UserRole } from "@/lib/constants";

/**
 * Check if the specified role is ADMIN
 */
export function isAdmin(role?: UserRole | null): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if the specified role is KURIR
 */
export function isCourier(role?: UserRole | null): boolean {
  return role === ROLES.KURIR;
}

/**
 * Determine default redirect path based on user role
 */
export function getDefaultDashboardPath(role?: UserRole | null): string {
  if (role === ROLES.ADMIN) {
    return "/admin/dashboard";
  }
  if (role === ROLES.KURIR) {
    return "/courier/dashboard";
  }
  return "/login";
}
