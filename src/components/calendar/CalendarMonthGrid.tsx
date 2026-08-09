"use client";

import { useMemo, useState } from "react";

import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";
import { getJourneyStart } from "@/lib/calendar/journey-utils";
import {
  buildMonthGrid,
  getWeekdayLabels,
} from "@/lib/calendar/utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type CalendarMonthGridProps = {
  year: number;
  month: number;
  items: MediaItem[];
  today?: string;
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  onOpenEntry: (item: MediaItem) => void;
  onMoveCover: (itemId: string, date: string) => void;
  variant?: "desktop" | "mobile";
  className?: string;
};

export function CalendarMonthGrid({
  year,
  month,
  items,
  today,
  selectedDate,
  onSelectDate,
  onOpenEntry,
  onMoveCover,
  variant = "desktop",
  className,
}: CalendarMonthGridProps) {
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekdayLabels = getWeekdayLabels();
  const isMobile = variant === "mobile";
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const startsByDate = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    for (const item of items) {
      const start = getJourneyStart(item);
      if (!start) continue;
      const list = map.get(start) ?? [];
      list.push(item);
      map.set(start, list);
    }
    return map;
  }, [items]);

  return (
    <div
      className={cn(
        "overflow-visible rounded-[22px] bg-white/[0.045] ring-1 ring-white/[0.07]",
        isMobile && "rounded-[18px]",
        draggingItemId && "cursor-grabbing",
        className,
      )}
    >
      <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className={cn(
              "py-2.5 text-center font-medium uppercase tracking-[0.14em] text-white/38",
              isMobile ? "py-2 text-[8px]" : "text-[9px] md:text-[10px]",
            )}
          >
            {label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label="Journal calendar"
        className="flex flex-col"
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            role="row"
            className={cn(
              "grid grid-cols-7 border-b border-white/[0.055] last:border-b-0",
              "divide-x divide-white/[0.055]",
            )}
          >
            {week.days.map((cell, cellIndex) => {
              if (!cell.date || !cell.day) {
                return (
                  <div
                    key={`${weekIndex}-${cellIndex}`}
                    className={cn(
                      "bg-[#0C1016]/80",
                      isMobile
                        ? "min-h-[118px]"
                        : "min-h-[148px] md:min-h-[158px]",
                    )}
                    aria-hidden="true"
                  />
                );
              }

              return (
                <CalendarDayCell
                  key={`${weekIndex}-${cellIndex}`}
                  date={cell.date}
                  day={cell.day}
                  isCurrentMonth={cell.isCurrentMonth}
                  isToday={today === cell.date}
                  isSelected={selectedDate === cell.date}
                  startEntries={startsByDate.get(cell.date) ?? []}
                  isDropTarget={dragOverDate === cell.date}
                  isDragging={Boolean(draggingItemId)}
                  draggingItemId={draggingItemId}
                  onSelectDate={onSelectDate}
                  onOpenEntry={onOpenEntry}
                  onDropCover={onMoveCover}
                  onDragHover={setDragOverDate}
                  onDragItemStart={setDraggingItemId}
                  onDragItemEnd={() => {
                    setDraggingItemId(null);
                    setDragOverDate(null);
                  }}
                  variant={variant}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
