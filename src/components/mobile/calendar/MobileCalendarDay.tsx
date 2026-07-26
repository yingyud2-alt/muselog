"use client";

import { dayHasMediaMarker } from "@/lib/calendar/journey-utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MobileCalendarDayProps = {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  items: MediaItem[];
  onSelectDate: () => void;
};

export function MobileCalendarDay({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  items,
  onSelectDate,
  date,
}: MobileCalendarDayProps) {
  const hasMarker = dayHasMediaMarker(date, items);

  return (
    <button
      type="button"
      onClick={onSelectDate}
      disabled={!isCurrentMonth}
      aria-label={`${day}${hasMarker ? ", has memory" : ""}`}
      aria-pressed={isSelected}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        isCurrentMonth
          ? "text-white/75 hover:bg-white/[0.05]"
          : "cursor-default text-white/15",
        isToday && "ring-1 ring-white/15",
        isSelected && "bg-white/[0.08] ring-1 ring-white/20",
      )}
    >
      <span
        className={cn(
          "text-sm tabular-nums",
          isToday && isCurrentMonth && "font-medium text-white/85",
        )}
      >
        {day}
      </span>

      {hasMarker && isCurrentMonth && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-white/45"
        />
      )}
    </button>
  );
}
