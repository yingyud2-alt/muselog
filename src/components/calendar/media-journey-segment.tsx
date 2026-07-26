"use client";

import { JourneyHighlightBar } from "@/components/calendar/JourneyHighlightBar";
import { MemoryCover } from "@/components/calendar/memory-cover";
import { getJourneyColor, getMediaTypeEmoji } from "@/lib/calendar/journey-utils";
import type { JourneySegment } from "@/lib/calendar/journey-overlay-utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MediaJourneySegmentProps = {
  segment: JourneySegment;
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
  laneStep: number;
  trackHeight: number;
  variant: "desktop" | "mobile";
};

export function MediaJourneySegment({
  segment,
  onSelect,
  laneStep,
  trackHeight,
  variant,
}: MediaJourneySegmentProps) {
  const { item, startCol, endCol, isRangeStart, isRangeEnd, lane } = segment;
  const span = endCol - startCol + 1;
  const isMobile = variant === "mobile";
  const color = getJourneyColor(item);

  return (
    <button
      type="button"
      aria-label={item.title}
      onClick={(event) => onSelect(item, event.currentTarget)}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        marginBottom: lane * laneStep,
        height: trackHeight,
      }}
      className="pointer-events-auto relative min-w-0 self-end focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25"
    >
      {isRangeStart && (
        <div
          className={cn(
            "absolute left-0 flex min-w-0 items-center gap-1",
            isMobile ? "bottom-[7px] max-w-full" : "bottom-[8px]",
          )}
        >
          <MemoryCover
            cover={item.cover}
            title={item.title}
            className={cn(
              "shrink-0 rounded-[3px] ring-1 ring-white/10",
              isMobile ? "aspect-[2/3] w-7 max-h-[34px]" : "aspect-[2/3] w-10 md:w-12",
            )}
          />
          <span
            className={cn(
              "min-w-0 truncate font-medium text-white/72",
              isMobile ? "max-w-[54px] text-[8px] leading-none" : "text-[10px]",
            )}
          >
            <span aria-hidden="true">{getMediaTypeEmoji(item.type)} </span>
            {item.title}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0">
        <JourneyHighlightBar
          color={color}
          className={cn("rounded-full", isMobile ? "h-[2px]" : "h-[3px]")}
        />
        {isRangeEnd && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -right-0.5 bottom-0 size-1 rounded-full opacity-70",
              color === "teal" && "bg-teal-400",
              color === "cyan" && "bg-cyan-400",
              color === "amber" && "bg-amber-400",
              color === "olive" && "bg-lime-600",
            )}
          />
        )}
      </div>
    </button>
  );
}
