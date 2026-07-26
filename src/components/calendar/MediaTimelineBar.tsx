import type { MediaItem } from "@/types/media";
import type { MediaTimeline } from "@/types/media-timeline";
import { TIMELINE_COLOR_STYLES } from "@/types/media-timeline";
import { cn } from "@/lib/utils";

import {
  getTimelineProgress,
  isDateInTimeline,
} from "@/lib/calendar/timeline-utils";

export type TimelineSegment = "none" | "start" | "middle" | "end" | "single";

export function getTimelineSegment(
  date: string,
  timeline: MediaTimeline,
): TimelineSegment {
  if (!isDateInTimeline(date, timeline)) {
    return "none";
  }

  if (timeline.startDate === timeline.endDate) {
    return "single";
  }

  if (date === timeline.startDate) {
    return "start";
  }

  if (date === timeline.endDate) {
    return "end";
  }

  return "middle";
}

type MediaTimelineBarProps = {
  date: string;
  timeline: MediaTimeline;
  className?: string;
};

export function MediaTimelineBar({
  date,
  timeline,
  className,
}: MediaTimelineBarProps) {
  const segment = getTimelineSegment(date, timeline);
  const color = TIMELINE_COLOR_STYLES[timeline.color];

  if (segment === "none") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-[38%] flex flex-col items-center",
        segment === "start" && "top-6 bottom-1",
        segment === "middle" && "inset-y-1",
        segment === "end" && "top-1 bottom-4",
        segment === "single" && "top-5 bottom-3",
        className,
      )}
    >
      <div className={cn("w-px flex-1 rounded-full", color.bar)} />
      {(segment === "start" || segment === "single") && (
        <div className={cn("size-2 shrink-0 rounded-full border", color.dot)} />
      )}
    </div>
  );
}

export function getCardProgress(
  item: MediaItem,
  timeline: MediaTimeline | null,
  referenceDate: string,
): number {
  if (timeline) {
    if (referenceDate < timeline.startDate) {
      return 0;
    }

    if (referenceDate >= timeline.endDate) {
      return 1;
    }

    return getTimelineProgress(referenceDate, timeline);
  }

  if (item.status === "FINISHED") {
    return 1;
  }

  if (item.status === "READING") {
    return 0.65;
  }

  return 0;
}

export function MediaProgressBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(1, progress));
  const filledBlocks = Math.round(filled * 8);
  const emptyBlocks = 8 - filledBlocks;

  return (
    <p
      className={cn(
        "font-label text-[8px] tracking-[0.14em] text-white/40",
        className,
      )}
      aria-label={`${Math.round(filled * 100)} percent complete`}
    >
      {"█".repeat(filledBlocks)}
      {"░".repeat(emptyBlocks)}
    </p>
  );
}
