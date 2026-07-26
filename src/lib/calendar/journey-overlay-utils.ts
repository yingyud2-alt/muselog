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

export function computeJourneySegments(
  items: MediaItem[],
  weeks: CalendarWeek[],
): Map<number, JourneySegment[]> {
  const journeyItems = filterJourneyItems(items);
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
        const cell = week.days[col];
        if (!cell.date) continue;

        if (cell.date >= start && cell.date <= end) {
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
        isRangeStart: week.days.some((cell) => cell.date === start),
        isRangeEnd: week.days.some((cell) => cell.date === end),
        lane,
      });
      result.set(weekIndex, existing);
    }
  }

  return result;
}

export const MOBILE_JOURNAL_OVERLAY = {
  dateZoneHeight: 22,
  laneStep: 18,
  trackHeight: 18,
} as const;

export const DESKTOP_JOURNAL_OVERLAY = {
  dateZoneHeight: 28,
  laneStep: 34,
  trackHeight: 34,
} as const;
