import { getPackageTypes } from "@/actions/package-types";
import { getRegionProviderInfoAction } from "@/actions/regions";
import { MasterDataTabs } from "@/components/admin/master-data-tabs";
import { Database } from "lucide-react";

export const metadata = {
  title: "Master Data & Wilayah — JetFood Polman",
};

export default async function MasterDataPage() {
  const packageTypes = await getPackageTypes();
  const providerInfo = await getRegionProviderInfoAction();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-orange-600" />
            Master Data & Integrasi Wilayah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfigurasi jenis paket operasional dan pemantauan integrasi API Wilayah Indonesia.
          </p>
        </div>
      </div>

      {/* Interactive Tabs */}
      <MasterDataTabs
        packageTypes={packageTypes}
        providerInfo={providerInfo}
      />
    </div>
  );
}
