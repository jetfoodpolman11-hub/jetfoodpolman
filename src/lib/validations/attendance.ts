/**
 * Attendance Input Validation & Rules
 */

export interface ClockInInput {
  courierId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface ClockOutInput {
  attendanceId: string;
  notes?: string;
}

export function validateClockInInput(input: ClockInInput): {
  isValid: boolean;
  errors: Partial<Record<keyof ClockInInput, string>>;
} {
  const errors: Partial<Record<keyof ClockInInput, string>> = {};

  if (!input.courierId) {
    errors.courierId = "ID Kurir tidak ditemukan";
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Format tanggal tidak valid (YYYY-MM-DD)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateClockOutInput(input: ClockOutInput): {
  isValid: boolean;
  errors: Partial<Record<keyof ClockOutInput, string>>;
} {
  const errors: Partial<Record<keyof ClockOutInput, string>> = {};

  if (!input.attendanceId) {
    errors.attendanceId = "ID Absensi tidak ditemukan";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
