"use client";

import { cn } from "@/lib/utils";
import { EmptyDayDecoration } from "./empty-day-decoration";

type CalendarDayCellProps = {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  onSelectDate: (date: string) => void;
  variant?: "desktop" | "mobile";
};

export function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday = false,
  isSelected = false,
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
      aria-label={`${day}`}
      aria-pressed={isSelected}
      className={cn(
        "relative z-20 flex h-full flex-col items-start rounded-[16px] transition-colors",
        "hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
        isMobile ? "min-h-[64px] px-1 pt-1.5" : "min-h-[72px] px-1.5 pt-2 md:min-h-[88px] md:rounded-[20px] md:pt-2.5",
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
    </button>
  );
}
