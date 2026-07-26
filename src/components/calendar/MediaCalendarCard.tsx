"use client";

import type { MediaItem } from "@/types/media";
import type { MediaTimeline } from "@/types/media-timeline";
import { cn } from "@/lib/utils";

import {
  getCardProgress,
  getTimelineSegment,
  MediaProgressBar,
  MediaTimelineBar,
} from "./MediaTimelineBar";
import { MemoryCover } from "./memory-cover";

export type MediaCalendarCardSize = "featured" | "companion";

type MediaCalendarCardProps = {
  item: MediaItem;
  size?: MediaCalendarCardSize;
  timeline: MediaTimeline | null;
  cellDate: string;
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
};

export function MediaCalendarCard({
  item,
  size = "featured",
  timeline,
  cellDate,
  onSelect,
}: MediaCalendarCardProps) {
  const isFeatured = size === "featured";
  const segment = timeline ? getTimelineSegment(cellDate, timeline) : "none";
  const showCard =
    !timeline ||
    segment === "start" ||
    segment === "single" ||
    segment === "end";
  const progress = getCardProgress(item, timeline, cellDate);

  if (!showCard) {
    return timeline ? (
      <div className="relative h-full min-h-[48px]">
        <MediaTimelineBar date={cellDate} timeline={timeline} />
      </div>
    ) : null;
  }

  return (
    <div className="relative">
      {timeline && <MediaTimelineBar date={cellDate} timeline={timeline} />}

      <button
        type="button"
        onClick={(event) => onSelect(item, event.currentTarget)}
        className={cn(
          "group relative z-[1] w-full text-left",
          "rounded-[12px] border border-white/[0.07] bg-white/[0.04]",
          "shadow-[0_2px_12px_rgba(0,0,0,0.1)] backdrop-blur-sm",
          "transition-all duration-200",
          "hover:border-white/14 hover:bg-white/[0.06]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          isFeatured ? "p-1.5" : "p-1",
        )}
      >
        <div
          className={cn(
            "relative mx-auto w-full",
            isFeatured ? "max-w-[58px]" : "max-w-[48px]",
          )}
        >
          <MemoryCover
            cover={item.cover}
            title={item.title}
            className={cn(isFeatured ? "rounded-[8px]" : "rounded-[6px]")}
          />
        </div>

        <div
          className={cn(
            "space-y-0.5",
            isFeatured ? "mt-1.5 px-0.5" : "mt-1 px-0.5",
          )}
        >
          <p
            className={cn(
              "text-center font-medium leading-tight text-white/88 group-hover:text-white",
              isFeatured ? "line-clamp-2 text-[9px]" : "truncate text-[8px]",
              segment === "end" && "line-clamp-3",
            )}
          >
            {item.title}
          </p>
          <MediaProgressBar progress={progress} className="text-center" />
        </div>
      </button>
    </div>
  );
}
