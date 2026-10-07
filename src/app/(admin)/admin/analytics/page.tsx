import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getOperationalAnalytics,
  type AnalyticsFeatureKey,
  type AnalyticsSubMenu,
} from "@/actions/analytics";
import {
  AnalyticsPeriodFilter,
  DeleteCourierRecapButton,
  DeleteRouteRecapButton,
} from "@/components/admin/analytics-period-filter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Banknote,
  Bike,
  ShoppingBag,
  Users,
  FileText,
  MapPin,
  ArrowRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Info,
  Layers,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rekap Operasional & Analitik — JetFood Polman",
  description:
    "Pusat rekapitulasi faktual operasional kurir per fitur layanan (Jastip, Paket, Langsung, Ojol, Random & Akumulasi) JetFood Polman",
};

const SUB_MENU_DEFS: {
  key: AnalyticsSubMenu;
  title: string;
  subtitle: string;
  fullDescription: string;
  Icon: typeof Layers;
  colorHex: string;
  badgeClass: string;
}[] = [
  {
    key: "akumulasi",
    title: "Akumulasi",
    subtitle: "Total Keseluruhan 5 Fitur",
    fullDescription:
      "Menampilkan akumulasi keseluruhan omset, laporan, kehadiran kurir, dan rincian dari masing-masing fitur layanan (Jastip, Paket, Langsung, Ojol, dan Random).",
    Icon: Layers,
    colorHex: "#DC0000",
    badgeClass: "bg-red-50 text-[#DC0000] border-red-200",
  },
  {
    key: "jastip",
    title: "Jastip",
    subtitle: "Jasa Belanja & Kebutuhan",
    fullDescription:
      "Layanan jasa ( belanja, cek barang, cek tempat, pemenuhan kebutuhan costumer ).",
    Icon: ShoppingBag,
    colorHex: "#2563eb",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "paket",
    title: "Paket",
    subtitle: "Jemput - Antar Paket",
    fullDescription: "Layanan jemput - antr paket ( mitra - costumer ).",
    Icon: Package,
    colorHex: "#059669",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "langsung",
    title: "Langsung",
    subtitle: "Order Tanpa Admin",
    fullDescription:
      "Paket atau jastip yang di peroleh oleh kurir tanpa melalui admin ( chat langsung costumer/mitra ke kurir).",
    Icon: Zap,
    colorHex: "#d97706",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "ojol",
    title: "Ojol",
    subtitle: "Ojek Online",
    fullDescription: "Ojek online.",
    Icon: Bike,
    colorHex: "#ea580c",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    key: "random",
    title: "Random",
    subtitle: "Jasa Layanan Apa Saja",
    fullDescription: "Jasa layanan apa aja.",
    Icon: Sparkles,
    colorHex: "#7c3aed",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const FEATURE_COLOR_MAP: Record<
  AnalyticsFeatureKey,
  { hex: string; bgLight: string; textClass: string; dotClass: string }
> = {
  jastip: {
    hex: "#2563eb",
    bgLight: "bg-blue-50/80 border-blue-200",
    textClass: "text-blue-700",
    dotClass: "bg-blue-600",
  },
  paket: {
    hex: "#059669",
    bgLight: "bg-emerald-50/80 border-emerald-200",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-600",
  },
  langsung: {
    hex: "#d97706",
    bgLight: "bg-amber-50/80 border-amber-200",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  ojol: {
    hex: "#ea580c",
    bgLight: "bg-orange-50/80 border-orange-200",
    textClass: "text-orange-700",
    dotClass: "bg-orange-600",
  },
  random: {
    hex: "#7c3aed",
    bgLight: "bg-purple-50/80 border-purple-200",
    textClass: "text-purple-700",
    dotClass: "bg-purple-600",
  },
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    feature?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const data = await getOperationalAnalytics({
    feature: params.feature,
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const {
    feature,
    summary,
    featureBreakdown,
    courierRecap,
    routeRecap,
    filteredReports,
  } = data;

  const activeSubDef =
    SUB_MENU_DEFS.find((d) => d.key === feature) || SUB_MENU_DEFS[0];
  const ActiveIcon = activeSubDef.Icon;

  const buildFeatureUrl = (targetFeature: AnalyticsSubMenu) => {
    const q = new URLSearchParams();
    q.set("feature", targetFeature);
    q.set("period", data.period);
    if (data.period === "custom") {
      q.set("startDate", data.startDate);
      q.set("endDate", data.endDate);
    }
    return `/admin/analytics?${q.toString()}`;
  };

  const maxCourierOrders = Math.max(
    1,
    ...courierRecap.map((c) => c.totalOrders)
  );
  const maxCourierOmset = Math.max(
    1,
    ...courierRecap.map((c) => c.totalOmset)
  );
  const maxRouteOrders = Math.max(1, ...routeRecap.map((r) => r.totalOrders));

  // SVG Donut stroke-dasharray calculations (circumference = 2 * PI * 42 ≈ 263.89)
  const circumference = 2 * Math.PI * 42;
  const totalAllFeaturesOmset = featureBreakdown.reduce(
    (acc, f) => acc + f.totalOmset,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#DC0000]" />
            <span>Rekap &amp; Analitik — {activeSubDef.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {activeSubDef.fullDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{data.periodLabel}</Badge>
        </div>
      </div>

      {/* SUB-MENU FITUR TABS (Akumulasi, Jastip, Paket, Langsung, Ojol, Random) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SUB_MENU_DEFS.map((item) => {
          const ItemIcon = item.Icon;
          const isSelected = feature === item.key;
          const fbItem =
            item.key === "akumulasi"
              ? null
              : featureBreakdown.find((f) => f.key === item.key);
          const itemOmset =
            item.key === "akumulasi"
              ? totalAllFeaturesOmset
              : fbItem?.totalOmset || 0;
          const itemReports =
            item.key === "akumulasi"
              ? featureBreakdown.reduce((s, f) => s + f.reportCount, 0)
              : fbItem?.reportCount || 0;

          return (
            <Link
              key={item.key}
              href={buildFeatureUrl(item.key)}
              className={`group relative flex flex-col justify-between rounded-2xl p-3.5 transition-all select-none ${
                isSelected
                  ? "bg-[#990000] text-white ring-2 ring-[#DC0000]/40 shadow-[0_8px_20px_rgba(180,0,0,0.3)] -translate-y-0.5"
                  : "bg-[#DC0000] text-white hover:bg-[#b80000] shadow-[0_4px_12px_rgba(220,0,0,0.2)] hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-white text-[#DC0000] shadow-xs"
                      : "bg-white/15 text-white group-hover:bg-white/25"
                  }`}
                >
                  <ItemIcon className="h-4 w-4 stroke-[2.3]" />
                </div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  {itemReports} lap
                </span>
              </div>

              <div className="mt-3">
                <span className="text-sm font-black tracking-tight block leading-tight">
                  {item.title}
                </span>
                <span className="text-[10px] text-red-100/90 font-medium block mt-0.5 truncate">
                  {item.subtitle}
                </span>
                <span className="text-xs font-extrabold text-white block mt-1.5 pt-1.5 border-t border-white/15">
                  {formatRupiah(itemOmset)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Banner Deskripsi Sub-Menu Aktif */}
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#DC0000] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#DC0000]">
                Sub-Menu Aktif: {activeSubDef.title}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              {activeSubDef.fullDescription}
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-red-100 shrink-0">
          Periode: <span className="text-[#DC0000]">{data.periodLabel}</span>
        </div>
      </div>

      {/* Period Filter Bar + Export PDF/Excel Buttons */}
      <AnalyticsPeriodFilter
        currentFeature={feature}
        featureLabel={activeSubDef.title}
        currentPeriod={data.period}
        startDate={data.startDate}
        endDate={data.endDate}
        periodLabel={data.periodLabel}
        summary={summary}
        courierRecap={courierRecap}
        routeRecap={routeRecap}
      />

      {/* KHUSUS SUB-MENU AKUMULASI: Breakdown Omset dari Masing-Masing 5 Fitur */}
      {feature === "akumulasi" && (
        <Card className="border-slate-200 shadow-2xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#DC0000]" />
                  <span>Rincian Omset &amp; Laporan per Fitur Layanan</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Akumulasi omset, jumlah order, dan laporan dari masing-masing 5 fitur operasional (klik kartu fitur untuk membuka detail sub-menu).
                </CardDescription>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Total Omset 5 Fitur: {formatRupiah(totalAllFeaturesOmset)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {featureBreakdown.map((fb) => {
                const subMeta = SUB_MENU_DEFS.find((d) => d.key === fb.key)!;
                const FbIcon = subMeta.Icon;
                const colorMeta = FEATURE_COLOR_MAP[fb.key];

                return (
                  <Link
                    key={fb.key}
                    href={buildFeatureUrl(fb.key)}
                    className={`group rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${colorMeta.bgLight}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <FbIcon className={`h-4 w-4 ${colorMeta.textClass}`} />
                          {fb.label}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200/70">
                          {fb.percentageOmset}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-snug">
                        {fb.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1">
                      <div className="text-base font-black text-slate-900">
                        {formatRupiah(fb.totalOmset)}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>{formatNumber(fb.totalOrders)} order</span>
                        <span>•</span>
                        <span>{formatNumber(fb.reportCount)} laporan</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1. STATISTIK UTAMA (Menyesuaikan Sub-Menu Aktif) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Omset */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-emerald-600">
              {feature === "akumulasi"
                ? "Total Omset Keseluruhan"
                : `Total Omset ${activeSubDef.title}`}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatRupiah(summary.totalOmset)}</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              {feature === "akumulasi"
                ? "Gabungan nilai transaksi dari seluruh 5 fitur layanan"
                : `Akumulasi pendapatan dari fitur ${activeSubDef.title}`}
            </span>
          </CardContent>
        </Card>

        {/* 2. Total Order / Transaksi */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-500">
              {feature === "akumulasi"
                ? "Total Order Keseluruhan"
                : `Total Order ${activeSubDef.title}`}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalOrders)} order</span>
              <div className="h-10 w-10 rounded-xl bg-red-50 text-[#DC0000] flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              {feature === "akumulasi"
                ? "Total volume tarikan order di semua fitur layanan"
                : `Total order layanan ${activeSubDef.title} pada periode ini`}
            </span>
          </CardContent>
        </Card>

        {/* 3. Jumlah Laporan */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-600">
              {feature === "akumulasi"
                ? "Total Laporan Masuk"
                : `Jumlah Laporan ${activeSubDef.title}`}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>{formatNumber(summary.totalReports)} laporan</span>
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Laporan operasional yang diinput kurir pada periode ini
            </span>
          </CardContent>
        </Card>

        {/* 4. Kehadiran & Kurir Aktif */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-indigo-600">
              {feature === "akumulasi"
                ? "Jumlah Kurir Hadir"
                : `Kurir Aktif (${activeSubDef.title})`}
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-between">
              <span>
                {formatNumber(
                  feature === "akumulasi"
                    ? summary.presentCouriersCount
                    : summary.activeFeatureCouriersCount
                )}{" "}
                kurir
              </span>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">
              Kehadiran periode:{" "}
              <strong className="text-slate-700">
                {summary.presentCouriersCount} kurir ({summary.totalAttendanceDays} hari kerja)
              </strong>
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 1.5 VISUALISASI DIAGRAM OPERASIONAL (Charts Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* DIAGRAM 1: Grafik Batang Aktivitas & Omset per Kurir (7 Cols) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-2xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#DC0000]" />
                  <span>
                    Diagram Aktivitas &amp; Omset per Kurir ({activeSubDef.title})
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Perbandingan visual volume order dan akumulasi omset tiap kurir pada periode terpilih.
                </CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#DC0000] inline-block" />
                  Order
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 inline-block" />
                  Omset (Rp)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {courierRecap.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Belum ada data kurir untuk ditampilkan dalam diagram.
              </div>
            ) : (
              <div className="space-y-4">
                {courierRecap.map((c) => {
                  const activityWidth = Math.max(
                    c.totalOrders > 0 ? 6 : 2,
                    Math.round((c.totalOrders / maxCourierOrders) * 100)
                  );
                  const revWidth = Math.max(
                    c.totalOmset > 0 ? 6 : 2,
                    Math.round((c.totalOmset / maxCourierOmset) * 100)
                  );

                  return (
                    <div
                      key={c.courierId}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-900 text-white px-2 py-0.5 text-[10px] font-mono font-bold">
                            {c.courierCode}
                          </span>
                          <span className="font-bold text-slate-900">
                            {c.courierName}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {c.attendanceDays} hari hadir • {c.reportCount} laporan
                        </span>
                      </div>

                      {/* Bar 1: Volume Order */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            Total Order ({activeSubDef.title})
                          </span>
                          <span className="font-bold text-[#DC0000]">
                            {formatNumber(c.totalOrders)} order
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#DC0000] to-orange-500 transition-all duration-500"
                            style={{ width: `${activityWidth}%` }}
                          />
                        </div>
                      </div>

                      {/* Bar 2: Total Nilai Rupiah */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            Total Omset ({activeSubDef.title})
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatRupiah(c.totalOmset)}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                            style={{ width: `${revWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIAGRAM 2: Donut Chart Komposisi & Rute Terpadat (5 Cols) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-2xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#DC0000]" />
              <span>
                {feature === "akumulasi"
                  ? "Diagram Komposisi Omset 5 Fitur"
                  : `Distribusi & Rute Fitur ${activeSubDef.title}`}
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {feature === "akumulasi"
                ? "Proporsi kontribusi omset dari Jastip, Paket, Langsung, Ojol, dan Random."
                : `Proporsi capaian dan rute pengantaran terpadat untuk layanan ${activeSubDef.title}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-5">
            {/* SVG Donut Ring (5 Features in Akumulasi, or Active Feature Share) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
              <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {feature === "akumulasi" &&
                    totalAllFeaturesOmset > 0 &&
                    (() => {
                      let cumulativeOffset = 0;
                      return featureBreakdown.map((fb) => {
                        const dash =
                          (fb.totalOmset / totalAllFeaturesOmset) * circumference;
                        const currentOffset = cumulativeOffset;
                        cumulativeOffset += dash;
                        return (
                          <circle
                            key={fb.key}
                            cx="50"
                            cy="50"
                            r="42"
                            fill="transparent"
                            stroke={FEATURE_COLOR_MAP[fb.key].hex}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={-currentOffset}
                          />
                        );
                      });
                    })()}
                  {feature !== "akumulasi" && summary.totalOmset > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke={activeSubDef.colorHex}
                      strokeWidth="12"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset="0"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {feature === "akumulasi" ? "Total 5 Fitur" : activeSubDef.title}
                  </span>
                  <span className="text-xs font-black text-slate-900 leading-tight mt-0.5">
                    {formatRupiah(summary.totalOmset)}
                  </span>
                </div>
              </div>

              {/* Legend Breakdown */}
              <div className="w-full space-y-2 text-xs">
                {featureBreakdown.map((fb) => {
                  const colorMeta = FEATURE_COLOR_MAP[fb.key];
                  const isCurrent = feature === fb.key;
                  return (
                    <div
                      key={fb.key}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-red-50 border-[#DC0000] ring-1 ring-[#DC0000]/30"
                          : "bg-slate-50/70 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-xs shrink-0 ${colorMeta.dotClass}`}
                        />
                        <span className="font-bold text-slate-800">
                          {fb.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900">
                          {formatRupiah(fb.totalOmset)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1.5">
                          ({fb.percentageOmset}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DIAGRAM 3: Grafik Distribusi Rute Terpadat */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#DC0000]" />
                  <span>Diagram Rute Terpadat ({activeSubDef.title})</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Top {Math.min(4, routeRecap.length)} Rute
                </span>
              </div>

              {routeRecap.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">
                  Belum ada data rute pada sub-menu dan periode ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {routeRecap.slice(0, 4).map((r) => {
                    const barW = Math.max(
                      8,
                      Math.round((r.totalOrders / maxRouteOrders) * 100)
                    );
                    return (
                      <div key={r.routeKey} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 truncate max-w-[200px]">
                            {r.originDisplay} → {r.destDisplay}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0">
                            {r.totalOrders} order ({formatRupiah(r.totalOmset)})
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. REKAP KURIR (Factual Data Only — No Ranking/Scoring) */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#DC0000]" />
                <span>
                  Rekap Operasional per Kurir — {activeSubDef.title}
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {feature === "akumulasi"
                  ? "Data faktual kehadiran, rincian omset masing-masing fitur (Jastip, Paket, Langsung, Ojol, Random), dan total akumulasi tiap kurir."
                  : `Data faktual kehadiran, jumlah laporan, total order, dan omset tiap kurir khusus pada fitur ${activeSubDef.title}.`}
              </CardDescription>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span>Data Faktual Tanpa Ranking / Scoring</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Nama Kurir</th>
                  <th className="py-3 px-4 text-center">Hari Hadir</th>
                  {feature === "akumulasi" ? (
                    <>
                      <th className="py-3 px-3 text-right">Jastip</th>
                      <th className="py-3 px-3 text-right">Paket</th>
                      <th className="py-3 px-3 text-right">Langsung</th>
                      <th className="py-3 px-3 text-right">Ojol</th>
                      <th className="py-3 px-3 text-right">Random</th>
                      <th className="py-3 px-4 text-right">Total Order</th>
                      <th className="py-3 px-4 text-right">Total Omset</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-center">Jumlah Laporan</th>
                      <th className="py-3 px-4 text-right">
                        Order ({activeSubDef.title})
                      </th>
                      <th className="py-3 px-4 text-right">
                        Omset ({activeSubDef.title})
                      </th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courierRecap.length === 0 ? (
                  <tr>
                    <td
                      colSpan={feature === "akumulasi" ? 10 : 6}
                      className="py-8 text-center text-slate-400"
                    >
                      Belum ada data kurir yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  courierRecap.map((c) => (
                    <tr
                      key={c.courierId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md bg-slate-100 text-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold">
                            {c.courierCode}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {c.courierName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.reportCount} laporan tercatat
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {formatNumber(c.attendanceDays)} hari
                      </td>

                      {feature === "akumulasi" ? (
                        <>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-semibold text-slate-900 block">
                              {formatRupiah(c.byFeature.jastip.omset)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.byFeature.jastip.orders} order
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-semibold text-slate-900 block">
                              {formatRupiah(c.byFeature.paket.omset)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.byFeature.paket.orders} order
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-semibold text-slate-900 block">
                              {formatRupiah(c.byFeature.langsung.omset)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.byFeature.langsung.orders} order
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-semibold text-slate-900 block">
                              {formatRupiah(c.byFeature.ojol.omset)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.byFeature.ojol.orders} order
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-semibold text-slate-900 block">
                              {formatRupiah(c.byFeature.random.omset)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.byFeature.random.orders} order
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatNumber(c.totalOrders)} order
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                            {formatRupiah(c.totalOmset)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-4 text-center">
                            <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-bold">
                              {formatNumber(c.reportCount)} laporan
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatNumber(c.totalOrders)} order
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                            {formatRupiah(c.totalOmset)}
                          </td>
                        </>
                      )}

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <DeleteCourierRecapButton
                          courierId={c.courierId}
                          courierName={c.courierName}
                          period={data.period}
                          startDate={data.startDate}
                          endDate={data.endDate}
                          periodLabel={data.periodLabel}
                          hasData={c.attendanceDays > 0 || c.reportCount > 0}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {courierRecap.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td className="py-3 px-4">
                      Total ({activeSubDef.title})
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatNumber(summary.totalAttendanceDays)} hari kerja
                    </td>
                    {feature === "akumulasi" ? (
                      <>
                        <td className="py-3 px-3 text-right">
                          {formatRupiah(
                            featureBreakdown.find((f) => f.key === "jastip")
                              ?.totalOmset || 0
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatRupiah(
                            featureBreakdown.find((f) => f.key === "paket")
                              ?.totalOmset || 0
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatRupiah(
                            featureBreakdown.find((f) => f.key === "langsung")
                              ?.totalOmset || 0
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatRupiah(
                            featureBreakdown.find((f) => f.key === "ojol")
                              ?.totalOmset || 0
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatRupiah(
                            featureBreakdown.find((f) => f.key === "random")
                              ?.totalOmset || 0
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatNumber(summary.totalOrders)} order
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700">
                          {formatRupiah(summary.totalOmset)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-center">
                          {formatNumber(summary.totalReports)} laporan
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatNumber(summary.totalOrders)} order
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700">
                          {formatRupiah(summary.totalOmset)}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. REKAP RUTE */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#DC0000]" />
            <span>
              Rekap Operasional per Rute Perjalanan — {activeSubDef.title}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Distribusi jumlah laporan, volume order, dan total omset berdasarkan pasangan wilayah keberangkatan dan tujuan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Rute (Wilayah Asal → Wilayah Tujuan)</th>
                  <th className="py-3 px-4 text-right">Jumlah Order</th>
                  <th className="py-3 px-4 text-right">Total Omset</th>
                  <th className="py-3 px-4 text-center">Jumlah Laporan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routeRecap.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada laporan rute perjalanan pada sub-menu dan periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  routeRecap.map((r) => (
                    <tr key={r.routeKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span>{r.originDisplay}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#DC0000] shrink-0" />
                          <span>{r.destDisplay}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatNumber(r.totalOrders)} order
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(r.totalOmset)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-bold">
                          {formatNumber(r.reportCount)} laporan
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <DeleteRouteRecapButton
                          routeKey={r.routeKey}
                          routeLabel={`${r.originDisplay} → ${r.destDisplay}`}
                          period={data.period}
                          startDate={data.startDate}
                          endDate={data.endDate}
                          periodLabel={data.periodLabel}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {routeRecap.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td className="py-3 px-4">
                      Total ({routeRecap.length} Rute Aktif)
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(summary.totalOrders)} order
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatRupiah(summary.totalOmset)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatNumber(summary.totalReports)} laporan
                    </td>
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. DAFTAR LAPORAN OPERASIONAL PADA SUB-MENU INI */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#DC0000]" />
                <span>
                  Daftar Laporan Harian — {activeSubDef.title}
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Rincian transaksi laporan yang diinput kurir pada sub-menu {activeSubDef.title} ({data.periodLabel}).
              </CardDescription>
            </div>
            <Badge variant="neutral">
              {filteredReports.length} laporan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kurir</th>
                  <th className="py-3 px-4">Fitur Layanan</th>
                  <th className="py-3 px-4">Rute Perjalanan</th>
                  <th className="py-3 px-4 text-right">Order</th>
                  <th className="py-3 px-4 text-right">Omset</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada laporan untuk fitur {activeSubDef.title} pada periode tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredReports.slice(0, 50).map((rep) => {
                    const repOrders =
                      (rep.orderCount || 0) +
                      (rep.ojolCount || 0) +
                      (rep.jastipCount || 0);
                    const repOmset =
                      (rep.omset || 0) +
                      (rep.ojolAmount || 0) +
                      (rep.jastipAmount || 0);

                    return (
                      <tr
                        key={rep.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                          {rep.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">
                            {rep.courierName || "Kurir"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {rep.courierCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-red-50 text-[#DC0000] border border-red-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                            {rep.packageTypeName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {rep.routeDisplay}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatNumber(repOrders)} order
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          {formatRupiah(repOmset)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/reports/${rep.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#DC0000]"
                          >
                            <span>Detail</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
