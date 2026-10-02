/**
 * Courier Management Validation (Admin)
 */

export interface CreateCourierInput {
  fullName: string;
  email: string;
  phone?: string;
  courierCode: string;
  vehicleType?: string;
  plateNumber?: string;
  password?: string;
}

export function validateCreateCourierInput(input: CreateCourierInput): {
  isValid: boolean;
  errors: Partial<Record<keyof CreateCourierInput, string>>;
} {
  const errors: Partial<Record<keyof CreateCourierInput, string>> = {};

  if (!input.fullName || !input.fullName.trim()) {
    errors.fullName = "Nama lengkap wajib diisi";
  }

  if (!input.email || !input.email.trim()) {
    errors.email = "Email wajib diisi";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Format email tidak valid";
  }

  if (!input.courierCode || !input.courierCode.trim()) {
    errors.courierCode = "Kode kurir wajib diisi";
  }

  if (input.password && input.password.length < 6) {
    errors.password = "Password minimal 6 karakter";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
