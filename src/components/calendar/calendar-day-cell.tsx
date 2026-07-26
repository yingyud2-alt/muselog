"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyDayDecoration } from "./empty-day-decoration";

type CalendarDayCellProps = {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  /** True when this day already has a journey entry */
  hasEntries?: boolean;
  onSelectDate: (date: string) => void;
  variant?: "desktop" | "mobile";
};

export function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday = false,
  isSelected = false,
  hasEntries = false,
  onSelectDate,
  date,
  variant = "desktop",
}: CalendarDayCellProps) {
  const isMobile = variant === "mobile";

  if (!isCurrentMonth) {
    return <EmptyDayDecoration day={day} isCurrentMonth={isCurrentMonth} />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelectDate(date)}
      aria-label={
        hasEntries ? `${day}` : `Add memory on day ${day}`
      }
      aria-pressed={isSelected}
      className={cn(
        "group relative z-10 flex h-full flex-col items-start rounded-[16px] transition-colors",
        "hover:bg-white/[0.06] hover:ring-1 hover:ring-white/12",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
        isMobile
          ? "min-h-[64px] px-1 pt-1.5"
          : "min-h-[72px] px-1.5 pt-2 md:min-h-[88px] md:rounded-[20px] md:pt-2.5",
        isToday && "ring-1 ring-white/15",
        isSelected && "bg-white/[0.06] ring-1 ring-white/20",
      )}
    >
      <span
        className={cn(
          "relative z-30 shrink-0 tabular-nums leading-none text-white/55",
          isMobile ? "text-sm" : "text-xs",
          isToday && "font-medium text-white/82",
        )}
      >
        {day}
      </span>

      {!hasEntries ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center",
            "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          <span className="flex size-6 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/45 backdrop-blur-sm md:size-7">
            <Plus className="size-3 md:size-3.5" />
          </span>
        </span>
      ) : null}
    </button>
  );
}
