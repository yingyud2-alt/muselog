import {
  calendarDayDelta,
  normalizeCalendarDate,
  shiftCalendarDate,
} from "@/lib/calendar/calendar-date";
import {
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import type { MediaItem } from "@/types/media";

/**
 * Cultural timeline helpers — startDate/endDate only.
 * No duration / hourly logic.
 */

/** Apply a new experience window. Keeps `date` aligned to start. */
export function applyJourneyRange(
  item: MediaItem,
  startDate: string,
  endDate: string,
): MediaItem {
  const start = normalizeCalendarDate(startDate);
  const end = normalizeCalendarDate(endDate);
  if (!start || !end) return item;

  let nextStart = start;
  let nextEnd = end;
  if (nextEnd < nextStart) {
    nextEnd = nextStart;
  }

  return {
    ...item,
    date: nextStart,
    startDate: nextStart,
    endDate: nextEnd,
  };
}

/** Shift the whole experience window by N days (drag body). */
export function shiftJourneyRange(
  item: MediaItem,
  deltaDays: number,
): MediaItem {
  if (!deltaDays) return item;
  const start = getJourneyStart(item);
  const end = getJourneyEnd(item);
  const nextStart = shiftCalendarDate(start, deltaDays);
  const nextEnd = shiftCalendarDate(end, deltaDays);
  if (!nextStart || !nextEnd) return item;
  return applyJourneyRange(item, nextStart, nextEnd);
}

/** Move the window so startDate lands on `anchorDate` (preserve length). */
export function moveJourneyToStartDate(
  item: MediaItem,
  anchorDate: string,
): MediaItem {
  const start = getJourneyStart(item);
  const end = getJourneyEnd(item);
  const delta = calendarDayDelta(start, anchorDate);
  if (delta == null || delta === 0) return item;
  const nextEnd = shiftCalendarDate(end, delta);
  const nextStart = normalizeCalendarDate(anchorDate);
  if (!nextStart || !nextEnd) return item;
  return applyJourneyRange(item, nextStart, nextEnd);
}

/** Resize left edge → new startDate (clamped to end). */
export function resizeJourneyStart(
  item: MediaItem,
  nextStartDate: string,
): MediaItem {
  const end = getJourneyEnd(item);
  const start = normalizeCalendarDate(nextStartDate);
  if (!start) return item;
  return applyJourneyRange(item, start, end < start ? start : end);
}

/** Resize right edge → new endDate (clamped to start). */
export function resizeJourneyEnd(
  item: MediaItem,
  nextEndDate: string,
): MediaItem {
  const start = getJourneyStart(item);
  const end = normalizeCalendarDate(nextEndDate);
  if (!end) return item;
  return applyJourneyRange(item, end < start ? end : start, end);
}

/** Resolve calendar date under a pointer (day cells use data-calendar-date). */
export function calendarDateFromPoint(
  clientX: number,
  clientY: number,
): string | null {
  if (typeof document === "undefined") return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const host = el.closest("[data-calendar-date]");
    const raw = host?.getAttribute("data-calendar-date");
    const date = normalizeCalendarDate(raw);
    if (date) return date;
  }
  return null;
}
