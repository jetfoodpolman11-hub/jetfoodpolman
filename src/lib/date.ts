import { DEFAULT_TIMEZONE } from "./constants";

/**
 * Get current ISO date formatted string in system timezone (WITA - Asia/Makassar)
 * Output: YYYY-MM-DD
 */
export function getWitaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Get current time string in WITA (Asia/Makassar)
 * Output: HH:mm (24-hour)
 */
export function getWitaTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Format full Indonesian date in WITA timezone
 * Example: "Jumat, 02 Oktober 2026"
 */
export function formatWitaDateFull(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format date and time in WITA timezone
 * Example: "02 Okt 2026, 08:01 WITA"
 */
export function formatWitaDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${formatted} WITA`;
}
