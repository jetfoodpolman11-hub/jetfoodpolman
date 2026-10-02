"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetCourierPasswordAction, type CourierWithProfile } from "@/actions/couriers";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: CourierWithProfile | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  courier,
  onSuccess,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!courier) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await resetCourierPasswordAction(courier.userId, newPassword);
      if (!res.success) {
        setError(res.error || "Gagal mereset kata sandi.");
      } else {
        setSuccessMsg(res.message || "Kata sandi berhasil direset.");
        setTimeout(() => {
          setNewPassword("");
          setConfirmPassword("");
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setSuccessMsg(null);
        onClose();
      }}
      title="Reset Kata Sandi Kurir"
      description={`Atur kata sandi baru untuk ${courier.fullName} (${courier.email}).`}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Kata Sandi Baru *"
          type="password"
          placeholder="Minimal 6 karakter"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          label="Ulangi Kata Sandi Baru *"
          type="password"
          placeholder="Ketik ulang kata sandi baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            className="flex items-center gap-1.5"
          >
            <KeyRound className="h-4 w-4" />
            Reset Sandi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
