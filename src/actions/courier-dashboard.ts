"use server";

import { requireCourier } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getWitaDateString, formatWitaDateFull, formatWitaDateTime } from "@/lib/date";
import { getTodayAttendanceForCourier, type TodayAttendanceState } from "@/actions/attendance";

export type { TodayAttendanceState };

export interface RecentReportItem {
  id: string;
  date: string;
  originDisplay: string;
  destDisplay: string;
  routeDisplay: string;
  packageName: string;
  orderCount: number;
  omset: number;
  ojolCount: number;
  jastipCount: number;
  createdAtFormatted: string;
}

export interface CourierDashboardData {
  courierName: string;
  courierCode: string;
  vehicleType: string | null;
  plateNumber: string | null;
  todayDateFormatted: string;
  attendance: TodayAttendanceState;
  recentReports: RecentReportItem[];
  todayStats: {
    totalOrders: number;
    totalOmset: number;
    reportCount: number;
  };
}

/**
 * Server Action: Fetch dedicated operational dashboard data for logged-in courier
 */
export async function getCourierDashboardData(): Promise<CourierDashboardData> {
  const session = await requireCourier();
  const todayWita = getWitaDateString(new Date());
  const todayFormatted = formatWitaDateFull(new Date());

  const courierName = session.profile?.fullName || "Kurir Lapangan";
  const courierCode = session.courier?.courierCode || "JF-KURIR";
  const vehicleType = session.courier?.vehicleType || "Motor";
  const plateNumber = session.courier?.plateNumber || null;
  const courierId = session.courier?.id;

  const attendanceState = courierId
    ? await getTodayAttendanceForCourier(courierId)
    : {
        hasClockedIn: false,
        hasClockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        clockInNotes: null,
        clockOutNotes: null,
        status: "BELUM_ABSEN" as const,
        statusLabel: "Belum Absen",
      };

  const isPlaceholderEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // Fallback / Initial State for development mode without database rows
  if (isPlaceholderEnv || !courierId) {
    return {
      courierName,
      courierCode,
      vehicleType,
      plateNumber,
      todayDateFormatted: todayFormatted,
      attendance: attendanceState,
      recentReports: [
        {
          id: "demo-report-1",
          date: todayWita,
          originDisplay: "Manding, Polewali",
          destDisplay: "Madatte, Polewali",
          routeDisplay: "Manding, Polewali → Madatte, Polewali",
          packageName: "Reguler",
          orderCount: 14,
          omset: 140000,
          ojolCount: 3,
          jastipCount: 2,
          createdAtFormatted: "Hari ini, 09:30 WITA",
        },
        {
          id: "demo-report-2",
          date: todayWita,
          originDisplay: "Manding, Polewali",
          destDisplay: "Sidodadi, Wonomulyo",
          routeDisplay: "Manding, Polewali → Sidodadi, Wonomulyo",
          packageName: "Express",
          orderCount: 8,
          omset: 96000,
          ojolCount: 1,
          jastipCount: 0,
          createdAtFormatted: "Hari ini, 11:15 WITA",
        },
      ],
      todayStats: {
        totalOrders: 22,
        totalOmset: 236000,
        reportCount: 2,
      },
    };
  }

  const supabase = await createClient();

  // Fetch Recent Reports submitted by THIS courier only (RLS enforced)
  const { data: reportsData } = await supabase
    .from("daily_reports")
    .select(`
      id,
      date,
      origin_village_name,
      origin_district_name,
      dest_village_name,
      dest_district_name,
      order_count,
      omset,
      ojol_count,
      jastip_count,
      created_at,
      package_types:package_type_id ( name )
    `)
    .eq("courier_id", courierId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const formattedReports: RecentReportItem[] = (reportsData || []).map((r) => {
    const pkg = Array.isArray(r.package_types) ? r.package_types[0] : r.package_types;
    const origin = `${r.origin_village_name}, ${r.origin_district_name}`;
    const dest = `${r.dest_village_name}, ${r.dest_district_name}`;

    return {
      id: r.id,
      date: r.date,
      originDisplay: origin,
      destDisplay: dest,
      routeDisplay: `${origin} → ${dest}`,
      packageName: pkg?.name || "Reguler",
      orderCount: r.order_count || 0,
      omset: Number(r.omset) || 0,
      ojolCount: r.ojol_count || 0,
      jastipCount: r.jastip_count || 0,
      createdAtFormatted: formatWitaDateTime(new Date(r.created_at)),
    };
  });

  // 3. Compute Today's Operational Metrics for this courier
  const { data: todayReports } = await supabase
    .from("daily_reports")
    .select("order_count, omset")
    .eq("courier_id", courierId)
    .eq("date", todayWita);

  let totalOrders = 0;
  let totalOmset = 0;
  if (todayReports) {
    for (const report of todayReports) {
      totalOrders += report.order_count || 0;
      totalOmset += Number(report.omset) || 0;
    }
  }

  return {
    courierName,
    courierCode,
    vehicleType,
    plateNumber,
    todayDateFormatted: todayFormatted,
    attendance: attendanceState,
    recentReports: formattedReports,
    todayStats: {
      totalOrders,
      totalOmset,
      reportCount: todayReports?.length || 0,
    },
  };
}
