"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { getWitaDateString } from "@/lib/date";
import { getCouriers } from "@/actions/couriers";
import { getAdminAttendanceList } from "@/actions/attendance";
import { getAdminDailyReports } from "@/actions/daily-reports";
import { toTitleCase } from "@/lib/region/route";

export type AnalyticsPeriod = "today" | "week" | "month" | "custom";

export interface AnalyticsFilterInput {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface OperationalAnalyticsSummary {
  totalOrders: number;
  totalOmset: number;
  totalOjolCount: number;
  totalOjolAmount: number;
  totalJastipCount: number;
  totalJastipAmount: number;
  presentCouriersCount: number;
  totalAttendanceDays: number;
  totalReports: number;
}

export interface CourierRecapItem {
  courierId: string;
  courierCode: string;
  courierName: string;
  status: "ACTIVE" | "INACTIVE";
  attendanceDays: number;
  reportCount: number;
  totalOrders: number;
  totalOmset: number;
  ojolCount: number;
  ojolAmount: number;
  jastipCount: number;
  jastipAmount: number;
}

export interface RouteRecapItem {
  routeKey: string;
  routeDisplay: string;
  originDisplay: string;
  destDisplay: string;
  totalOrders: number;
  totalOmset: number;
  reportCount: number;
}

export interface OperationalAnalyticsResult {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
  summary: OperationalAnalyticsSummary;
  courierRecap: CourierRecapItem[];
  routeRecap: RouteRecapItem[];
}

/**
 * Resolve WITA date range from period selection
 */
export async function resolvePeriodDateRange(input?: AnalyticsFilterInput): Promise<{
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
}> {
  const todayWita = getWitaDateString(new Date());
  const rawPeriod = (input?.period || "today").toLowerCase();

  const validPeriods: AnalyticsPeriod[] = ["today", "week", "month", "custom"];
  const period: AnalyticsPeriod = validPeriods.includes(rawPeriod as AnalyticsPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : "today";

  if (period === "today") {
    return {
      period: "today",
      startDate: todayWita,
      endDate: todayWita,
      periodLabel: `Hari Ini (${todayWita})`,
    };
  }

  if (period === "week") {
    const base = new Date(`${todayWita}T12:00:00+08:00`);
    base.setDate(base.getDate() - 6);
    const startDate = getWitaDateString(base);
    return {
      period: "week",
      startDate,
      endDate: todayWita,
      periodLabel: `Minggu Ini / 7 Hari Terakhir (${startDate} s/d ${todayWita})`,
    };
  }

  if (period === "month") {
    const startDate = `${todayWita.slice(0, 8)}01`;
    return {
      period: "month",
      startDate,
      endDate: todayWita,
      periodLabel: `Bulan Ini (${startDate} s/d ${todayWita})`,
    };
  }

  // Custom date range
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let start = input?.startDate && dateRegex.test(input.startDate) ? input.startDate : todayWita;
  let end = input?.endDate && dateRegex.test(input.endDate) ? input.endDate : todayWita;

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  return {
    period: "custom",
    startDate: start,
    endDate: end,
    periodLabel: `Rentang Kustom (${start} s/d ${end})`,
  };
}

/**
 * Compute server-side operational recap & analytics for Admin.
 * Strictly factual presentation — no courier ranking or scoring.
 */
export async function getOperationalAnalytics(
  input?: AnalyticsFilterInput
): Promise<OperationalAnalyticsResult> {
  await requireAdmin();

  const { period, startDate, endDate, periodLabel } = await resolvePeriodDateRange(input);

  // Execute server-side queries in parallel within [startDate, endDate]
  const [couriers, attendanceList, reportsResult] = await Promise.all([
    getCouriers(),
    getAdminAttendanceList({ startDate, endDate }),
    getAdminDailyReports({ startDate, endDate, page: 1, perPage: 5000 }),
  ]);

  const reports = reportsResult.reports;

  // 1. Initialize Courier Recap Map from all registered couriers
  const courierMap = new Map<
    string,
    {
      courierId: string;
      courierCode: string;
      courierName: string;
      status: "ACTIVE" | "INACTIVE";
      attendedDates: Set<string>;
      reportCount: number;
      totalOrders: number;
      totalOmset: number;
      ojolCount: number;
      ojolAmount: number;
      jastipCount: number;
      jastipAmount: number;
    }
  >();

  for (const c of couriers) {
    courierMap.set(c.id, {
      courierId: c.id,
      courierCode: c.courierCode,
      courierName: c.fullName,
      status: c.status,
      attendedDates: new Set<string>(),
      reportCount: 0,
      totalOrders: 0,
      totalOmset: 0,
      ojolCount: 0,
      ojolAmount: 0,
      jastipCount: 0,
      jastipAmount: 0,
    });
  }

  // 2. Process Attendance Records in Period
  const uniquePresentCouriers = new Set<string>();
  const globalCourierDatePairs = new Set<string>();

  for (const att of attendanceList) {
    if (att.date < startDate || att.date > endDate) continue;

    uniquePresentCouriers.add(att.courierId);
    globalCourierDatePairs.add(`${att.courierId}:${att.date}`);

    let entry = courierMap.get(att.courierId);
    if (!entry) {
      entry = {
        courierId: att.courierId,
        courierCode: att.courierCode || "JF-KURIR",
        courierName: att.courierName || "Kurir",
        status: "ACTIVE",
        attendedDates: new Set<string>(),
        reportCount: 0,
        totalOrders: 0,
        totalOmset: 0,
        ojolCount: 0,
        ojolAmount: 0,
        jastipCount: 0,
        jastipAmount: 0,
      };
      courierMap.set(att.courierId, entry);
    }
    entry.attendedDates.add(att.date);
  }

  // 3. Process Daily Reports in Period (Summary + Courier Recap + Route Recap)
  let totalOrders = 0;
  let totalOmset = 0;
  let totalOjolCount = 0;
  let totalOjolAmount = 0;
  let totalJastipCount = 0;
  let totalJastipAmount = 0;
  let totalReports = 0;

  const routeMap = new Map<string, RouteRecapItem>();

  for (const rep of reports) {
    if (rep.date < startDate || rep.date > endDate) continue;

    totalReports += 1;
    totalOrders += rep.orderCount || 0;
    totalOmset += rep.omset || 0;
    totalOjolCount += rep.ojolCount || 0;
    totalOjolAmount += rep.ojolAmount || 0;
    totalJastipCount += rep.jastipCount || 0;
    totalJastipAmount += rep.jastipAmount || 0;

    // Aggregate per Courier
    let cEntry = courierMap.get(rep.courierId);
    if (!cEntry) {
      cEntry = {
        courierId: rep.courierId,
        courierCode: rep.courierCode || "JF-KURIR",
        courierName: rep.courierName || "Kurir",
        status: "ACTIVE",
        attendedDates: new Set<string>(),
        reportCount: 0,
        totalOrders: 0,
        totalOmset: 0,
        ojolCount: 0,
        ojolAmount: 0,
        jastipCount: 0,
        jastipAmount: 0,
      };
      courierMap.set(rep.courierId, cEntry);
    }

    cEntry.reportCount += 1;
    cEntry.totalOrders += rep.orderCount || 0;
    cEntry.totalOmset += rep.omset || 0;
    cEntry.ojolCount += rep.ojolCount || 0;
    cEntry.ojolAmount += rep.ojolAmount || 0;
    cEntry.jastipCount += rep.jastipCount || 0;
    cEntry.jastipAmount += rep.jastipAmount || 0;

    // Aggregate per Route
    const routeKey = `${rep.origin.villageId}->${rep.destination.villageId}`;
    const originDisplay = `${toTitleCase(rep.origin.villageName)}, ${toTitleCase(rep.origin.districtName)}`;
    const destDisplay = `${toTitleCase(rep.destination.villageName)}, ${toTitleCase(rep.destination.districtName)}`;

    let rEntry = routeMap.get(routeKey);
    if (!rEntry) {
      rEntry = {
        routeKey,
        routeDisplay: rep.routeDisplay,
        originDisplay,
        destDisplay,
        totalOrders: 0,
        totalOmset: 0,
        reportCount: 0,
      };
      routeMap.set(routeKey, rEntry);
    }

    rEntry.totalOrders += rep.orderCount || 0;
    rEntry.totalOmset += rep.omset || 0;
    rEntry.reportCount += 1;
  }

  // 4. Finalize Courier Recap List (Neutral order by courierCode, NO ranking/scoring)
  const courierRecap: CourierRecapItem[] = Array.from(courierMap.values())
    .map((item) => ({
      courierId: item.courierId,
      courierCode: item.courierCode,
      courierName: item.courierName,
      status: item.status,
      attendanceDays: item.attendedDates.size,
      reportCount: item.reportCount,
      totalOrders: item.totalOrders,
      totalOmset: item.totalOmset,
      ojolCount: item.ojolCount,
      ojolAmount: item.ojolAmount,
      jastipCount: item.jastipCount,
      jastipAmount: item.jastipAmount,
    }))
    .sort((a, b) => a.courierCode.localeCompare(b.courierCode, "id-ID"));

  // 5. Finalize Route Recap List (Neutral alphabetical order by routeDisplay)
  const routeRecap: RouteRecapItem[] = Array.from(routeMap.values()).sort((a, b) =>
    a.routeDisplay.localeCompare(b.routeDisplay, "id-ID")
  );

  return {
    period,
    startDate,
    endDate,
    periodLabel,
    summary: {
      totalOrders,
      totalOmset,
      totalOjolCount,
      totalOjolAmount,
      totalJastipCount,
      totalJastipAmount,
      presentCouriersCount: uniquePresentCouriers.size,
      totalAttendanceDays: globalCourierDatePairs.size,
      totalReports,
    },
    courierRecap,
    routeRecap,
  };
}
