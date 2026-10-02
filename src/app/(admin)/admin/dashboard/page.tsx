import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, CalendarCheck, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Pusat kendali dan monitoring operasional harian JetFood Polman.
          </p>
        </div>
        <div>
          <Badge variant="success">Role: ADMIN — Hak Akses Penuh</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Kurir Terdaftar</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>--</span>
              <Users className="h-5 w-5 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">Akan dihubungkan di Phase 3</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Kehadiran Hari Ini</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>--</span>
              <CalendarCheck className="h-5 w-5 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">Monitoring real-time WITA</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Order Hari Ini</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>--</span>
              <FileText className="h-5 w-5 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">Agregasi laporan operasional</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Status Keamanan</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 flex items-center justify-between">
              <span>Tervalidasi</span>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">RBAC & RLS Terproteksi</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
