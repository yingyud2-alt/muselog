import {
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import { cn } from "@/lib/utils";
import {
  JOURNEY_COLOR_SWATCHES,
  TYPE_JOURNEY_COLORS,
  type MediaItem,
} from "@/types/media";

type MemoryJourneyIndicatorProps = {
  item: MediaItem;
  variant?: "desktop" | "mobile";
  className?: string;
};

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Card-owned multi-day journey mark.
 * Belongs to the work cover — not a calendar-wide Gantt bar.
 *
 * cover
 *   |
 *   ●━━━━━━━━━━●
 *   start      end
 */
export function MemoryJourneyIndicator({
  item,
  variant = "desktop",
  className,
}: MemoryJourneyIndicatorProps) {
  const isMobile = variant === "mobile";
  const start = getJourneyStart(item);
  const end = getJourneyEnd(item);
  const swatch = JOURNEY_COLOR_SWATCHES[TYPE_JOURNEY_COLORS[item.type]];

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center",
        isMobile ? "mt-0.5" : "mt-1",
        className,
      )}
      aria-label={`Journey ${formatShortDate(start)} to ${formatShortDate(end)}`}
    >
      {/* Stem from cover → rail */}
      <div
        className={cn("w-px rounded-full", isMobile ? "h-1" : "h-1.5")}
        style={{ backgroundColor: swatch, opacity: 0.35 }}
        aria-hidden="true"
      />

      {/* ●━━━━━━━━━━● */}
      <div
        className={cn(
          "relative flex w-full items-center",
          isMobile ? "max-w-[56px]" : "max-w-[68px] md:max-w-[76px]",
        )}
      >
        <span
          className={cn(
            "relative z-[1] shrink-0 rounded-full",
            isMobile ? "size-[4px]" : "size-[5px]",
          )}
          style={{
            backgroundColor: swatch,
            opacity: 0.8,
            boxShadow: `0 0 5px ${swatch}40`,
          }}
          aria-hidden="true"
        />
        <div
          className="mx-0.5 h-[1.5px] min-w-0 flex-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${swatch}66, ${swatch}44 50%, ${swatch}66)`,
            opacity: 0.7,
          }}
          aria-hidden="true"
        />
        <span
          className={cn(
            "relative z-[1] shrink-0 rounded-full",
            isMobile ? "size-[4px]" : "size-[5px]",
          )}
          style={{
            backgroundColor: swatch,
            opacity: 0.7,
            boxShadow: `0 0 5px ${swatch}30`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* start date · end date */}
      <div
        className={cn(
          "mt-0.5 flex w-full justify-between gap-1 tabular-nums text-white/40",
          isMobile
            ? "max-w-[56px] text-[7px] leading-none"
            : "max-w-[68px] text-[8px] leading-none md:max-w-[76px]",
        )}
      >
        <span className="min-w-0 truncate">{formatShortDate(start)}</span>
        <span className="min-w-0 truncate text-right">{formatShortDate(end)}</span>
      </div>
    </div>
  );
}
