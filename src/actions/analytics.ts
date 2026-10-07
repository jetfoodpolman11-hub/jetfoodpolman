"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWitaDateString } from "@/lib/date";
import { getCouriers } from "@/actions/couriers";
import { getAdminAttendanceList } from "@/actions/attendance";
import { getAdminDailyReports, type DailyReportRecord } from "@/actions/daily-reports";
import { toTitleCase } from "@/lib/region/route";

export type AnalyticsPeriod = "today" | "week" | "month" | "custom";
export type AnalyticsFeatureKey = "jastip" | "paket" | "langsung" | "ojol" | "random";
export type AnalyticsSubMenu = "akumulasi" | AnalyticsFeatureKey;

export interface AnalyticsFilterInput {
  period?: string;
  startDate?: string;
  endDate?: string;
  feature?: string;
}

export interface FeatureBreakdownItem {
  key: AnalyticsFeatureKey;
  label: string;
  description: string;
  reportCount: number;
  totalOrders: number;
  totalOmset: number;
  courierCount: number;
  percentageOmset: number;
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
  activeFeatureCouriersCount: number;
}

export interface CourierFeatureMetrics {
  reportCount: number;
  orders: number;
  omset: number;
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
  byFeature: Record<AnalyticsFeatureKey, CourierFeatureMetrics>;
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
  feature: AnalyticsSubMenu;
  featureLabel: string;
  featureDescription: string;
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
  summary: OperationalAnalyticsSummary;
  featureBreakdown: FeatureBreakdownItem[];
  courierRecap: CourierRecapItem[];
  routeRecap: RouteRecapItem[];
  filteredReports: DailyReportRecord[];
}

const FEATURE_META: Record<
  AnalyticsSubMenu,
  { label: string; description: string }
> = {
  akumulasi: {
    label: "Akumulasi Keseluruhan",
    description:
      "Akumulasi keseluruhan omset, laporan, kehadiran kurir, dan distribusi rute dari seluruh fitur layanan (Jastip, Paket, Langsung, Ojol, dan Random).",
  },
  jastip: {
    label: "Jastip",
    description:
      "Layanan jasa (belanja, cek barang, cek tempat, pemenuhan kebutuhan customer).",
  },
  paket: {
    label: "Paket",
    description: "Layanan jemput - antar paket (mitra - customer).",
  },
  langsung: {
    label: "Langsung",
    description:
      "Paket atau jastip yang diperoleh oleh kurir tanpa melalui admin (chat langsung customer/mitra ke kurir).",
  },
  ojol: {
    label: "Ojol",
    description: "Ojek online.",
  },
  random: {
    label: "Random",
    description: "Jasa layanan apa saja.",
  },
};

const FEATURE_ORDER: AnalyticsFeatureKey[] = [
  "jastip",
  "paket",
  "langsung",
  "ojol",
  "random",
];

function resolveSubMenu(raw?: string): AnalyticsSubMenu {
  const cleaned = (raw || "akumulasi").toLowerCase().trim();
  if (
    cleaned === "jastip" ||
    cleaned === "paket" ||
    cleaned === "langsung" ||
    cleaned === "ojol" ||
    cleaned === "random"
  ) {
    return cleaned;
  }
  return "akumulasi";
}

function resolveReportFeatureKey(packageTypeName?: string): AnalyticsFeatureKey {
  const lower = (packageTypeName || "").toLowerCase().trim();
  if (lower.includes("jastip")) return "jastip";
  if (lower.includes("langsung")) return "langsung";
  if (lower.includes("ojol")) return "ojol";
  if (lower.includes("random")) return "random";
  return "paket";
}

function getEffectiveReportMetrics(rep: DailyReportRecord): {
  orders: number;
  omset: number;
} {
  const orders =
    (rep.orderCount || 0) + (rep.ojolCount || 0) + (rep.jastipCount || 0);
  const omset =
    (rep.omset || 0) + (rep.ojolAmount || 0) + (rep.jastipAmount || 0);
  return { orders, omset };
}

function createEmptyByFeature(): Record<
  AnalyticsFeatureKey,
  CourierFeatureMetrics
> {
  return {
    jastip: { reportCount: 0, orders: 0, omset: 0 },
    paket: { reportCount: 0, orders: 0, omset: 0 },
    langsung: { reportCount: 0, orders: 0, omset: 0 },
    ojol: { reportCount: 0, orders: 0, omset: 0 },
    random: { reportCount: 0, orders: 0, omset: 0 },
  };
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
 * Supports sub-menu filtering by feature (akumulasi, jastip, paket, langsung, ojol, random).
 * Strictly factual presentation — no courier ranking or scoring.
 */
export async function getOperationalAnalytics(
  input?: AnalyticsFilterInput
): Promise<OperationalAnalyticsResult> {
  await requireAdmin();

  const feature = resolveSubMenu(input?.feature);
  const featureMeta = FEATURE_META[feature];
  const { period, startDate, endDate, periodLabel } = await resolvePeriodDateRange(input);

  // Execute server-side queries in parallel within [startDate, endDate]
  const [couriers, attendanceList, reportsResult] = await Promise.all([
    getCouriers(),
    getAdminAttendanceList({ startDate, endDate }),
    getAdminDailyReports({ startDate, endDate, page: 1, perPage: 5000 }),
  ]);

  const allPeriodReports = reportsResult.reports.filter(
    (rep) => rep.date >= startDate && rep.date <= endDate
  );

  // 1. Compute Global Feature Breakdown across all 5 features for the period
  const featureStatsMap: Record<
    AnalyticsFeatureKey,
    {
      reportCount: number;
      totalOrders: number;
      totalOmset: number;
      couriers: Set<string>;
    }
  > = {
    jastip: { reportCount: 0, totalOrders: 0, totalOmset: 0, couriers: new Set() },
    paket: { reportCount: 0, totalOrders: 0, totalOmset: 0, couriers: new Set() },
    langsung: { reportCount: 0, totalOrders: 0, totalOmset: 0, couriers: new Set() },
    ojol: { reportCount: 0, totalOrders: 0, totalOmset: 0, couriers: new Set() },
    random: { reportCount: 0, totalOrders: 0, totalOmset: 0, couriers: new Set() },
  };

  let grandTotalAllFeaturesOmset = 0;

  for (const rep of allPeriodReports) {
    const fKey = resolveReportFeatureKey(rep.packageTypeName);
    const { orders, omset } = getEffectiveReportMetrics(rep);
    featureStatsMap[fKey].reportCount += 1;
    featureStatsMap[fKey].totalOrders += orders;
    featureStatsMap[fKey].totalOmset += omset;
    featureStatsMap[fKey].couriers.add(rep.courierId);
    grandTotalAllFeaturesOmset += omset;
  }

  const featureBreakdown: FeatureBreakdownItem[] = FEATURE_ORDER.map((key) => {
    const st = featureStatsMap[key];
    const pct =
      grandTotalAllFeaturesOmset > 0
        ? Math.round((st.totalOmset / grandTotalAllFeaturesOmset) * 100)
        : 0;
    return {
      key,
      label: FEATURE_META[key].label,
      description: FEATURE_META[key].description,
      reportCount: st.reportCount,
      totalOrders: st.totalOrders,
      totalOmset: st.totalOmset,
      courierCount: st.couriers.size,
      percentageOmset: pct,
    };
  });

  // 2. Initialize Courier Recap Map from all registered couriers
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
      byFeature: Record<AnalyticsFeatureKey, CourierFeatureMetrics>;
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
      byFeature: createEmptyByFeature(),
    });
  }

  // 3. Process Attendance Records in Period
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
        byFeature: createEmptyByFeature(),
      };
      courierMap.set(att.courierId, entry);
    }
    entry.attendedDates.add(att.date);
  }

  // 4. Filter Reports for Active Sub-Menu (or all if "akumulasi")
  const filteredReports =
    feature === "akumulasi"
      ? allPeriodReports
      : allPeriodReports.filter(
          (rep) => resolveReportFeatureKey(rep.packageTypeName) === feature
        );

  let totalOrders = 0;
  let totalOmset = 0;
  let totalOjolCount = 0;
  let totalOjolAmount = 0;
  let totalJastipCount = 0;
  let totalJastipAmount = 0;
  let totalReports = 0;

  const activeFeatureCouriers = new Set<string>();
  const routeMap = new Map<string, RouteRecapItem>();

  for (const rep of filteredReports) {
    const fKey = resolveReportFeatureKey(rep.packageTypeName);
    const { orders, omset } = getEffectiveReportMetrics(rep);

    totalReports += 1;
    totalOrders += orders;
    totalOmset += omset;
    totalOjolCount += fKey === "ojol" ? orders : rep.ojolCount || 0;
    totalOjolAmount += fKey === "ojol" ? omset : rep.ojolAmount || 0;
    totalJastipCount += fKey === "jastip" ? orders : rep.jastipCount || 0;
    totalJastipAmount += fKey === "jastip" ? omset : rep.jastipAmount || 0;

    activeFeatureCouriers.add(rep.courierId);

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
        byFeature: createEmptyByFeature(),
      };
      courierMap.set(rep.courierId, cEntry);
    }

    cEntry.reportCount += 1;
    cEntry.totalOrders += orders;
    cEntry.totalOmset += omset;
    cEntry.ojolCount += fKey === "ojol" ? orders : rep.ojolCount || 0;
    cEntry.ojolAmount += fKey === "ojol" ? omset : rep.ojolAmount || 0;
    cEntry.jastipCount += fKey === "jastip" ? orders : rep.jastipCount || 0;
    cEntry.jastipAmount += fKey === "jastip" ? omset : rep.jastipAmount || 0;

    cEntry.byFeature[fKey].reportCount += 1;
    cEntry.byFeature[fKey].orders += orders;
    cEntry.byFeature[fKey].omset += omset;

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

    rEntry.totalOrders += orders;
    rEntry.totalOmset += omset;
    rEntry.reportCount += 1;
  }

  // 5. Finalize Courier Recap List (Neutral order by courierCode, NO ranking/scoring)
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
      byFeature: item.byFeature,
    }))
    .sort((a, b) => a.courierCode.localeCompare(b.courierCode, "id-ID"));

  // 6. Finalize Route Recap List (Neutral alphabetical order by routeDisplay)
  const routeRecap: RouteRecapItem[] = Array.from(routeMap.values()).sort((a, b) =>
    a.routeDisplay.localeCompare(b.routeDisplay, "id-ID")
  );

  return {
    feature,
    featureLabel: featureMeta.label,
    featureDescription: featureMeta.description,
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
      activeFeatureCouriersCount: activeFeatureCouriers.size,
    },
    featureBreakdown,
    courierRecap,
    routeRecap,
    filteredReports,
  };
}

export interface AnalyticsDeleteResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action: Delete operational reports & attendance in the selected period (Admin ONLY)
 */
export async function deleteAnalyticsPeriodAction(
  input?: AnalyticsFilterInput
): Promise<AnalyticsDeleteResult> {
  await requireAdmin();

  const { startDate, endDate, periodLabel } = await resolvePeriodDateRange(input);
  const supabase = createAdminClient();

  const [repRes, attRes] = await Promise.all([
    supabase
      .from("daily_reports")
      .delete()
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("attendance")
      .delete()
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  if (repRes.error) {
    return {
      success: false,
      error: `Gagal menghapus laporan rekap: ${repRes.error.message}`,
    };
  }
  if (attRes.error) {
    return {
      success: false,
      error: `Gagal menghapus presensi rekap: ${attRes.error.message}`,
    };
  }

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");
  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/history");
  revalidatePath("/courier/attendance");

  return {
    success: true,
    message: `Seluruh data rekap (laporan & absensi) pada periode ${periodLabel} berhasil dihapus.`,
  };
}

/**
 * Server Action: Delete a specific courier's operational reports & attendance in the selected period (Admin ONLY)
 */
export async function deleteAnalyticsCourierRecapAction(
  courierId: string,
  input?: AnalyticsFilterInput
): Promise<AnalyticsDeleteResult> {
  await requireAdmin();

  if (!courierId || !courierId.trim()) {
    return { success: false, error: "ID kurir tidak valid." };
  }

  const { startDate, endDate, periodLabel } = await resolvePeriodDateRange(input);
  const supabase = createAdminClient();

  const [repRes, attRes] = await Promise.all([
    supabase
      .from("daily_reports")
      .delete()
      .eq("courier_id", courierId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("attendance")
      .delete()
      .eq("courier_id", courierId)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  if (repRes.error) {
    return {
      success: false,
      error: `Gagal menghapus laporan kurir: ${repRes.error.message}`,
    };
  }
  if (attRes.error) {
    return {
      success: false,
      error: `Gagal menghapus presensi kurir: ${attRes.error.message}`,
    };
  }

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");
  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/history");
  revalidatePath("/courier/attendance");

  return {
    success: true,
    message: `Data rekap kurir pada periode ${periodLabel} berhasil dihapus.`,
  };
}

/**
 * Server Action: Delete operational reports for a specific route in the selected period (Admin ONLY)
 */
export async function deleteAnalyticsRouteRecapAction(
  routeKey: string,
  input?: AnalyticsFilterInput
): Promise<AnalyticsDeleteResult> {
  await requireAdmin();

  const parts = (routeKey || "").split("->");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { success: false, error: "Identitas rute tidak valid." };
  }

  const [originVillageId, destVillageId] = parts;
  const { startDate, endDate, periodLabel } = await resolvePeriodDateRange(input);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("daily_reports")
    .delete()
    .eq("origin_village_id", originVillageId)
    .eq("dest_village_id", destVillageId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    return {
      success: false,
      error: `Gagal menghapus data rekap rute: ${error.message}`,
    };
  }

  revalidatePath("/admin/analytics");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/dashboard");
  revalidatePath("/courier/dashboard");
  revalidatePath("/courier/history");

  return {
    success: true,
    message: `Data rekap rute pada periode ${periodLabel} berhasil dihapus.`,
  };
}
