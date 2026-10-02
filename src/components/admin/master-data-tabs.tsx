"use client";

import { useState } from "react";
import { PackageTypesManager } from "./package-types-manager";
import { RegionIntegrationTester } from "./region-integration-tester";
import { PackageTypeItem } from "@/actions/package-types";
import { Package, Globe } from "lucide-react";

interface MasterDataTabsProps {
  packageTypes: PackageTypeItem[];
  providerInfo: {
    type: string;
    name: string;
    baseUrl: string;
  };
}

export function MasterDataTabs({
  packageTypes,
  providerInfo,
}: MasterDataTabsProps) {
  const [activeTab, setActiveTab] = useState<"packages" | "region">("packages");

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Tabs Master Data">
          <button
            type="button"
            onClick={() => setActiveTab("packages")}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "packages"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Jenis Paket Operasional</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {packageTypes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("region")}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "region"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Integrasi & Uji Wilayah API</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "packages" ? (
        <PackageTypesManager initialItems={packageTypes} />
      ) : (
        <RegionIntegrationTester providerInfo={providerInfo} />
      )}
    </div>
  );
}
