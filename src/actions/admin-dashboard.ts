"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { getWitaDateString } from "@/lib/date";
import { fetchAllCouriersInternal } from "@/actions/couriers";
import { getAdminAttendanceList } from "@/actions/attendance";

export interface AdminDashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  presentToday: number;
  notPresentToday: number;
  todayWita: string;
}

/**
 * Fetch core operational metrics for Admin Dashboard from live Supabase data
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireAdmin();
  const todayWita = getWitaDateString(new Date());

  const [couriers, todayAttendance] = await Promise.all([
    fetchAllCouriersInternal(),
    getAdminAttendanceList({ date: todayWita }),
  ]);

  const totalCouriers = couriers.length;
  const activeCouriers = couriers.filter(
    (c) => c.status === "ACTIVE" && c.isActive
  ).length;

  const uniquePresentIds = new Set(todayAttendance.map((a) => a.courierId));
  const presentToday = uniquePresentIds.size;
  const notPresentToday = Math.max(0, activeCouriers - presentToday);

  return {
    totalCouriers,
    activeCouriers,
    presentToday,
    notPresentToday,
    todayWita,
  };
}
