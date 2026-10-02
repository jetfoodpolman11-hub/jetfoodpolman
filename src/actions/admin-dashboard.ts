"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getWitaDateString } from "@/lib/date";

export interface AdminDashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  presentToday: number;
  notPresentToday: number;
  todayWita: string;
}

/**
 * Fetch core operational metrics for Admin Dashboard
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireAdmin();
  const supabase = await createClient();
  const todayWita = getWitaDateString(new Date());

  // 1. Total couriers
  const { count: totalCouriers, error: totalErr } = await supabase
    .from("couriers")
    .select("*", { count: "exact", head: true });

  if (totalErr) {
    console.error("Error fetching total couriers:", totalErr);
  }

  // 2. Active couriers
  const { count: activeCouriers, error: activeErr } = await supabase
    .from("couriers")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (activeErr) {
    console.error("Error fetching active couriers:", activeErr);
  }

  // 3. Attended today in WITA
  const { count: presentToday, error: attendErr } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("date", todayWita);

  if (attendErr) {
    console.error("Error fetching today attendance:", attendErr);
  }

  const total = totalCouriers || 0;
  const active = activeCouriers || 0;
  const present = presentToday || 0;
  const notPresent = Math.max(0, active - present);

  return {
    totalCouriers: total,
    activeCouriers: active,
    presentToday: present,
    notPresentToday: notPresent,
    todayWita,
  };
}
