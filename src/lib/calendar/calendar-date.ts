/**
 * Calendar date identity — YYYY-MM-DD strings only.
 * No local↔UTC shifts via Date parsing for journal matching.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Pad year/month/day into a stable calendar key. */
export function formatCalendarDate(
  year: number,
  month: number,
  day: number,
): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Normalize any journal/calendar date value to YYYY-MM-DD.
 * - Already YYYY-MM-DD → keep as authored (no Date parse)
 * - ISO datetime → take the date prefix before `T` (authored calendar day)
 * - Date instance → use UTC Y/M/D (deterministic; matches MuseLog display dates)
 */
export function normalizeCalendarDate(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (DATE_RE.test(trimmed)) {
      return isRealCalendarDay(trimmed) ? trimmed : null;
    }

    const isoPrefix = trimmed.slice(0, 10);
    if (
      DATE_RE.test(isoPrefix) &&
      (trimmed[10] === "T" || trimmed[10] === " ")
    ) {
      return isRealCalendarDay(isoPrefix) ? isoPrefix : null;
    }

    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatCalendarDate(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }

  return null;
}

function isRealCalendarDay(date: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return false;
  const probe = Date.UTC(year, month - 1, day);
  const check = new Date(probe);
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

export function isCalendarDateString(value: unknown): value is string {
  return typeof value === "string" && normalizeCalendarDate(value) === value;
}

export function calendarDatesEqual(left: unknown, right: unknown): boolean {
  const a = normalizeCalendarDate(left);
  const b = normalizeCalendarDate(right);
  return Boolean(a && b && a === b);
}

export function getEntryCalendarDate(entry: {
  date?: string;
  startDate?: string;
  endDate?: string;
}): string | null {
  return (
    normalizeCalendarDate(entry.date) ??
    normalizeCalendarDate(entry.startDate) ??
    normalizeCalendarDate(entry.endDate)
  );
}

/** Shift a YYYY-MM-DD by whole days (UTC civil calendar — no TZ drift). */
export function shiftCalendarDate(
  date: string,
  deltaDays: number,
): string | null {
  const normalized = normalizeCalendarDate(date);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return formatCalendarDate(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
  );
}

/** Whole-day delta from → to (to - from). */
export function calendarDayDelta(from: string, to: string): number | null {
  const a = normalizeCalendarDate(from);
  const b = normalizeCalendarDate(to);
  if (!a || !b) return null;
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
