import type { Locale } from "@/lib/i18n/types";

function localeTag(locale: Locale): string {
  return locale;
}

/** Full month name, e.g. "七月" / "July". */
export function formatMonthName(
  locale: Locale,
  year: number,
  monthIndex: number,
): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

/** Short weekday, e.g. "一" / "Mon". */
export function formatWeekdayShort(
  locale: Locale,
  date: Date,
): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

/** Long weekday, e.g. "星期一" / "Monday". */
export function formatWeekdayLong(
  locale: Locale,
  date: Date,
): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
}

/** Full calendar date. */
export function formatFullDate(
  locale: Locale,
  date: Date,
): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Compact date, e.g. 2026/7/27 or 7/27/2026. */
export function formatCompactDate(
  locale: Locale,
  date: Date,
): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Locale-aware integer / decimal formatting for counts and ratings. */
export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

/** Month + year label for calendar headers. */
export function formatMonthYear(
  locale: Locale,
  year: number,
  monthIndex: number,
): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
