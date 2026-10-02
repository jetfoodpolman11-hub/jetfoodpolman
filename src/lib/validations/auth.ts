/**
 * Authentication Input Validation
 */

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginInput(input: LoginInput): {
  isValid: boolean;
  errors: Partial<Record<keyof LoginInput, string>>;
} {
  const errors: Partial<Record<keyof LoginInput, string>> = {};

  if (!input.email || !input.email.trim()) {
    errors.email = "Email wajib diisi";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Format email tidak valid";
  }

  if (!input.password) {
    errors.password = "Password wajib diisi";
  } else if (input.password.length < 6) {
    errors.password = "Password minimal 6 karakter";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
