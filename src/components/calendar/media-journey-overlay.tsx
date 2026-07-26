"use client";

import {
  DESKTOP_JOURNAL_OVERLAY,
  MOBILE_JOURNAL_OVERLAY,
  type JourneySegment,
} from "@/lib/calendar/journey-overlay-utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

import { MediaJourneySegment } from "./media-journey-segment";

type MediaJourneyOverlayProps = {
  segments: JourneySegment[];
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
  variant?: "desktop" | "mobile";
  dateZoneHeight: number;
};

export function MediaJourneyOverlay({
  segments,
  onSelect,
  variant = "desktop",
}: MediaJourneyOverlayProps) {
  if (segments.length === 0) return null;

  const isMobile = variant === "mobile";
  const config = isMobile ? MOBILE_JOURNAL_OVERLAY : DESKTOP_JOURNAL_OVERLAY;

  return (
    <div
      className={cn(
        // Full cell height, above day cells — covers capture clicks; empty space passes through
        "pointer-events-none absolute inset-0 z-30 grid grid-cols-7 items-end pb-0.5",
        isMobile ? "gap-1" : "gap-1.5 md:gap-3",
      )}
    >
      {segments.map((segment) => (
        <MediaJourneySegment
          key={`${segment.item.id}-${segment.weekIndex}-${segment.startCol}`}
          segment={segment}
          onSelect={onSelect}
          laneStep={config.laneStep}
          trackHeight={config.trackHeight}
          variant={variant}
        />
      ))}
    </div>
  );
}
