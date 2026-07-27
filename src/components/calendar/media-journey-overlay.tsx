"use client";

import {
  DESKTOP_JOURNAL_OVERLAY,
  MOBILE_JOURNAL_OVERLAY,
  type JourneySegment,
} from "@/lib/calendar/journey-overlay-utils";
import { getJourneyColor } from "@/lib/calendar/journey-utils";
import { JOURNEY_COLOR_SWATCHES } from "@/types/media";
import { cn } from "@/lib/utils";

type MediaJourneyOverlayProps = {
  segments: JourneySegment[];
  variant?: "desktop" | "mobile";
  /** Extra height when multiple period lines stack. */
  linePad?: number;
};

/**
 * Period lines only — covers live in day cells.
 * Not draggable; not event blocks.
 */
export function MediaJourneyOverlay({
  segments,
  variant = "desktop",
  linePad = 0,
}: MediaJourneyOverlayProps) {
  if (segments.length === 0) return null;

  const isMobile = variant === "mobile";
  const config = isMobile ? MOBILE_JOURNAL_OVERLAY : DESKTOP_JOURNAL_OVERLAY;
  const zoneHeight = Math.max(config.lineZoneHeight, linePad);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 grid grid-cols-7",
        isMobile ? "gap-1" : "gap-1 md:gap-1.5",
      )}
      style={{ height: zoneHeight }}
      aria-hidden="true"
    >
      {segments.map((segment) => {
        const span = segment.endCol - segment.startCol + 1;
        const swatch = JOURNEY_COLOR_SWATCHES[getJourneyColor(segment.item)];

        return (
          <div
            key={`${segment.item.id}-${segment.weekIndex}-${segment.startCol}`}
            style={{
              gridColumn: `${segment.startCol + 1} / span ${span}`,
              paddingBottom: 2 + segment.lane * config.laneStep,
            }}
            className="flex min-w-0 items-end"
          >
            <div
              className={cn(
                "h-[2px] w-full rounded-full",
                segment.isRangeStart && "rounded-l-full",
                segment.isRangeEnd && "rounded-r-full",
              )}
              style={{
                backgroundColor: `${swatch}aa`,
                boxShadow: `0 0 0 1px ${swatch}18`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
