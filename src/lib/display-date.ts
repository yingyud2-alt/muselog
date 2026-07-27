/** Fixed reference date for deterministic SSR date rendering. */
export const DISPLAY_REFERENCE_DATE = new Date(Date.UTC(2026, 6, 27, 14, 0, 0));

export const DISPLAY_DATE_LOCALE = "en-US";

export function formatDisplayWeekday(
  date: Date = DISPLAY_REFERENCE_DATE,
): string {
  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDisplayDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const value = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(value);
}

export function getDisplayGreeting(
  date: Date = DISPLAY_REFERENCE_DATE,
): string {
  const hour = date.getUTCHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
