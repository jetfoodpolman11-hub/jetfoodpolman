/**
 * Application Constants — JETFOOD POLMAN
 */

export const APP_NAME = "JetFood Polman";
export const APP_DESCRIPTION = "Courier Operations Web App";

/**
 * System Timezone: WITA (UTC+8) for Polewali Mandar / Sulawesi Barat
 */
export const DEFAULT_TIMEZONE = "Asia/Makassar";

/**
 * User Roles
 */
export const ROLES = {
  ADMIN: "ADMIN",
  KURIR: "KURIR",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Attendance Statuses
 */
export const ATTENDANCE_STATUS = {
  MASUK: "MASUK",
  PULANG: "PULANG",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

/**
 * Courier Account Statuses
 */
export const COURIER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type CourierStatus = (typeof COURIER_STATUS)[keyof typeof COURIER_STATUS];

/**
 * App Route Definitions
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    COURIERS: "/admin/couriers",
    ATTENDANCE: "/admin/attendance",
    REPORTS: "/admin/reports",
    MASTER_DATA: "/admin/master-data",
  },
  COURIER: {
    DASHBOARD: "/courier/dashboard",
    ATTENDANCE: "/courier/attendance",
    REPORT_NEW: "/courier/reports/new",
    HISTORY: "/courier/history",
  },
} as const;
