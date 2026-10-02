import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: `Masuk — ${APP_NAME}`,
  description: `Halaman login sistem operasional internal ${APP_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Back link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Brand Card Header */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white font-bold text-lg shadow-sm mb-3">
              JF
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
              {APP_NAME}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {APP_DESCRIPTION} — Masuk ke portal operasional
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Suspense
              fallback={
                <div className="py-8 text-center text-sm text-slate-400 animate-pulse">
                  Memuat form autentikasi...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-xs text-slate-500">
          Hanya untuk personil resmi JetFood Polman.
          <br />
          Jika lupa sandi, hubungi Administrator sistem.
        </p>
      </div>
    </div>
  );
}
