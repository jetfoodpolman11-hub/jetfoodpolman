"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  label?: string;
}

export function LogoutButton({
  className,
  iconClassName,
  showIcon = true,
  label = "Keluar",
}: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
      disabled={isPending}
      title="Keluar"
      className={
        className ||
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
      }
    >
      {showIcon && <LogOut className={iconClassName || "h-3.5 w-3.5"} />}
      {label ? <span>{isPending ? "Keluar..." : label}</span> : null}
    </button>
  );
}
