import { getCouriers } from "@/actions/couriers";
import { CourierTable } from "@/components/admin/courier-table";
import { Users } from "lucide-react";

export const metadata = {
  title: "Manajemen Kurir — JetFood Polman",
};

export default async function CouriersPage() {
  const couriers = await getCouriers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-600" />
            Manajemen Kurir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data akun kurir, status operasional, dan kredensial login kurir JetFood Polman.
          </p>
        </div>
      </div>

      {/* Courier Interactive Table */}
      <CourierTable initialCouriers={couriers} />
    </div>
  );
}
