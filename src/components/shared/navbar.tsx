import Link from "next/link";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

interface NavbarProps {
  userRole?: "ADMIN" | "KURIR" | null;
  userName?: string | null;
}

export function Navbar({ userRole, userName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 font-bold text-white shadow-sm">
            JF
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
              {APP_NAME}
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
              {APP_DESCRIPTION}
            </span>
          </div>
        </Link>

        {userName && (
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="font-semibold text-slate-900 block">{userName}</span>
              <span className="text-slate-500">{userRole}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
