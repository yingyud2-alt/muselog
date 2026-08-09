import {
  normalizeCalendarDate,
} from "@/lib/calendar/calendar-date";
import {
  filterJourneyItems,
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import type { CalendarWeek } from "@/lib/calendar/utils";
import type { MediaItem } from "@/types/media";

export type JourneySegment = {
  item: MediaItem;
  weekIndex: number;
  startCol: number;
  endCol: number;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  lane: number;
};

/** Multi-day cultural journey — single-day memories stay as normal cards. */
export function isMultiDayJourney(item: MediaItem): boolean {
  return getJourneyStart(item) !== getJourneyEnd(item);
}

function assignGlobalItemLanes(items: MediaItem[]): Map<string, number> {
  const sorted = [...items].sort((left, right) => {
    const startCompare = getJourneyStart(left).localeCompare(getJourneyStart(right));
    if (startCompare !== 0) return startCompare;
    return getJourneyEnd(right).localeCompare(getJourneyEnd(left));
  });

  const laneEndDates: string[] = [];
  const itemLanes = new Map<string, number>();

  for (const item of sorted) {
    const start = getJourneyStart(item);
    const end = getJourneyEnd(item);
    let lane = laneEndDates.findIndex((laneEnd) => laneEnd < start);

    if (lane === -1) {
      lane = laneEndDates.length;
      laneEndDates.push(end);
    } else {
      laneEndDates[lane] = end;
    }

    itemLanes.set(item.id, lane);
  }

  return itemLanes;
}

/**
 * Place journey progress lines by normalized start/end YYYY-MM-DD.
 * Only multi-day entries (startDate !== endDate) produce segments.
 */
export function computeJourneySegments(
  items: MediaItem[],
  weeks: CalendarWeek[],
): Map<number, JourneySegment[]> {
  const journeyItems = filterJourneyItems(items).filter(isMultiDayJourney);
  const itemLanes = assignGlobalItemLanes(journeyItems);
  const result = new Map<number, JourneySegment[]>();

  for (const item of journeyItems) {
    const start = getJourneyStart(item);
    const end = getJourneyEnd(item);
    const lane = itemLanes.get(item.id) ?? 0;

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
      const week = weeks[weekIndex];
      let startCol: number | null = null;
      let endCol: number | null = null;

      for (let col = 0; col < week.days.length; col += 1) {
        const cellDate = normalizeCalendarDate(week.days[col]?.date);
        if (!cellDate) continue;

        if (cellDate >= start && cellDate <= end) {
          if (startCol === null) startCol = col;
          endCol = col;
        }
      }

      if (startCol === null || endCol === null) continue;

      const existing = result.get(weekIndex) ?? [];
      existing.push({
        item,
        weekIndex,
        startCol,
        endCol,
        isRangeStart: week.days.some(
          (cell) => normalizeCalendarDate(cell.date) === start,
        ),
        isRangeEnd: week.days.some(
          (cell) => normalizeCalendarDate(cell.date) === end,
        ),
        lane,
      });
      result.set(weekIndex, existing);
    }
  }

  return result;
}

/** Subtle bottom track — thin progress lines, not Gantt bars. */
export const MOBILE_JOURNAL_OVERLAY = {
  lineZoneHeight: 10,
  laneStep: 3,
  trackHeight: 2,
  bottomInset: 5,
} as const;

export const DESKTOP_JOURNAL_OVERLAY = {
  lineZoneHeight: 12,
  laneStep: 4,
  trackHeight: 2,
  bottomInset: 6,
} as const;
