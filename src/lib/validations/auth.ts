/**
 * Authentication Input Validation
 * Supports both Email (for Admin) and Courier Code (for Courier)
 */

export interface LoginInput {
  email?: string;
  identifier?: string;
  password: string;
}

export function validateLoginInput(input: LoginInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const id = (input.identifier || input.email || "").trim();

  if (!id) {
    errors.identifier = "Email atau Kode Kurir wajib diisi";
  } else if (id.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
      errors.identifier = "Format email tidak valid";
    }
  } else {
    // Courier code: e.g. JF-001, JF001
    if (id.length < 3) {
      errors.identifier = "Kode kurir minimal 3 karakter (contoh: JF-001)";
    }
  }

  if (!input.password) {
    errors.password = "Kata sandi wajib diisi";
  } else if (input.password.length < 6) {
    errors.password = "Kata sandi minimal 6 karakter";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
