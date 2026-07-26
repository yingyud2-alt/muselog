import type { MediaItem } from "@/types/media";
import type { MediaTimeline } from "@/types/media-timeline";

export function getTimelineDayIndex(date: string): number {
  return Number(date.split("-")[2]);
}

export function isDateInTimeline(
  date: string,
  timeline: MediaTimeline,
): boolean {
  return date >= timeline.startDate && date <= timeline.endDate;
}

export function getTimelineProgress(
  date: string,
  timeline: MediaTimeline,
): number {
  const start = getTimelineDayIndex(timeline.startDate);
  const end = getTimelineDayIndex(timeline.endDate);
  const current = getTimelineDayIndex(date);

  if (end <= start) {
    return date === timeline.endDate ? 1 : 0;
  }

  if (current < start) {
    return 0;
  }

  if (current > end) {
    return 1;
  }

  return (current - start + 1) / (end - start + 1);
}

export function getReadingProgressForTimeline(
  timeline: MediaTimeline,
  referenceDate: string,
): number {
  if (referenceDate < timeline.startDate) {
    return 0;
  }

  if (referenceDate >= timeline.endDate) {
    return 1;
  }

  return getTimelineProgress(referenceDate, timeline);
}

export function formatTimelineDayLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));

  return `${monthLabel} ${day}`;
}

export type DayMediaEntry = {
  item: MediaItem;
  timeline: MediaTimeline | null;
};

export function getDayMediaEntries(
  date: string,
  items: MediaItem[],
  timelines: MediaTimeline[],
): DayMediaEntry[] {
  const timelineByMediaId = new Map(
    timelines.map((timeline) => [timeline.mediaId, timeline]),
  );
  const entries = new Map<string, DayMediaEntry>();

  for (const item of items) {
    const timeline = timelineByMediaId.get(item.id) ?? null;
    const onTimeline = timeline ? isDateInTimeline(date, timeline) : false;

    if (item.date === date || onTimeline) {
      entries.set(item.id, { item, timeline });
    }
  }

  return [...entries.values()];
}

export function hasTimelineOnDate(
  date: string,
  timelines: MediaTimeline[] = [],
): boolean {
  return timelines.some((timeline) => isDateInTimeline(date, timeline));
}
