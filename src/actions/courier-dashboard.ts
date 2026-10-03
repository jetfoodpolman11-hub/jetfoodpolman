"use server";

import { requireCourier } from "@/lib/auth/guards";
import { getWitaDateString, formatWitaDateFull } from "@/lib/date";
import {
  getTodayAttendanceForCourier,
  type TodayAttendanceState,
} from "@/actions/attendance";
import { getCourierDailyReports } from "@/actions/daily-reports";

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
  avatarUrl: string | null;
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
 * Server Action: Fetch dedicated operational dashboard data for logged-in courier from live Supabase data
 */
export async function getCourierDashboardData(): Promise<CourierDashboardData> {
  const session = await requireCourier();
  const todayWita = getWitaDateString(new Date());
  const todayFormatted = formatWitaDateFull(new Date());

  const courierName = session.profile?.fullName || "Kurir Lapangan";
  const courierCode = session.courier?.courierCode || "JF-KURIR";
  const vehicleType = session.courier?.vehicleType || "Sepeda Motor";
  const plateNumber = session.courier?.plateNumber || null;
  const avatarUrl =
    session.profile?.avatarUrl || session.courier?.avatarUrl || null;
  const courierId = session.courier?.id;

  const [attendanceState, reports] = await Promise.all([
    courierId
      ? getTodayAttendanceForCourier(courierId)
      : Promise.resolve({
          hasClockedIn: false,
          hasClockedOut: false,
          clockInTime: null,
          clockOutTime: null,
          clockInNotes: null,
          clockOutNotes: null,
          status: "BELUM_ABSEN" as const,
          statusLabel: "Belum Absen",
        }),
    getCourierDailyReports(),
  ]);

  const todayReports = reports.filter((r) => r.date === todayWita);
  const totalOrders = todayReports.reduce((sum, r) => sum + r.orderCount, 0);
  const totalOmset = todayReports.reduce((sum, r) => sum + r.omset, 0);

  return {
    courierName,
    courierCode,
    vehicleType,
    plateNumber,
    avatarUrl,
    todayDateFormatted: todayFormatted,
    attendance: attendanceState,
    recentReports: reports.slice(0, 5).map((r) => ({
      id: r.id,
      date: r.date,
      originDisplay: `${r.origin.villageName}, ${r.origin.districtName}`,
      destDisplay: `${r.destination.villageName}, ${r.destination.districtName}`,
      routeDisplay: r.routeDisplay,
      packageName: r.packageTypeName,
      orderCount: r.orderCount,
      omset: r.omset,
      ojolCount: r.ojolCount,
      jastipCount: r.jastipCount,
      createdAtFormatted: r.createdAtFormatted,
    })),
    todayStats: {
      totalOrders,
      totalOmset,
      reportCount: todayReports.length,
    },
  };
}
