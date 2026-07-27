"use client";

import { useMemo, useState } from "react";

import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";
import { MediaJourneyOverlay } from "@/components/calendar/media-journey-overlay";
import {
  computeJourneySegments,
  DESKTOP_JOURNAL_OVERLAY,
  MOBILE_JOURNAL_OVERLAY,
} from "@/lib/calendar/journey-overlay-utils";
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

/** Fixed row height — compact Apple-month + journal density. */
const CELL_HEIGHT = { desktop: 68, mobile: 56 } as const;

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
  const segmentsByWeek = useMemo(
    () => computeJourneySegments(items, weeks),
    [items, weeks],
  );
  const isMobile = variant === "mobile";
  const overlayConfig = isMobile
    ? MOBILE_JOURNAL_OVERLAY
    : DESKTOP_JOURNAL_OVERLAY;
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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
        isMobile
          ? "rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-2.5"
          : "rounded-[22px] border border-white/[0.1] bg-white/[0.035] p-3 md:rounded-[24px] md:p-4",
        className,
      )}
    >
      <div
        className={cn(
          "mb-2 grid shrink-0 grid-cols-7 px-0.5",
          isMobile ? "mb-1.5 gap-1" : "mb-2 gap-1 md:gap-1.5",
        )}
      >
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className={cn(
              "text-center uppercase text-white/40",
              isMobile
                ? "text-[8px] font-medium tracking-[0.12em]"
                : "text-[9px] tracking-[0.14em]",
            )}
          >
            {label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label="Journal calendar"
        className={cn(isMobile ? "space-y-1" : "flex flex-col gap-1 md:gap-1.5")}
      >
        {weeks.map((week, weekIndex) => {
          const segments = segmentsByWeek.get(weekIndex) ?? [];
          const weekLanes =
            segments.length > 0
              ? Math.max(...segments.map((segment) => segment.lane)) + 1
              : 0;
          const linePad =
            weekLanes > 0
              ? overlayConfig.lineZoneHeight +
                (weekLanes - 1) * overlayConfig.laneStep
              : 0;
          const rowHeight = CELL_HEIGHT[variant] + linePad;

          return (
            <div
              key={`week-${weekIndex}`}
              role="row"
              className={cn(
                "relative grid grid-cols-7",
                isMobile ? "gap-1" : "gap-1 md:gap-1.5",
              )}
              style={{ height: rowHeight }}
            >
              {week.days.map((cell, cellIndex) => {
                if (!cell.date || !cell.day) {
                  return (
                    <div
                      key={`${weekIndex}-${cellIndex}`}
                      className={cn(
                        "rounded-[10px] border border-white/[0.04] bg-white/[0.015]",
                        isMobile
                          ? "h-[56px]"
                          : "h-[64px] md:h-[68px] md:rounded-[12px]",
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
                    onSelectDate={onSelectDate}
                    onOpenEntry={onOpenEntry}
                    onDropCover={onMoveCover}
                    onDragHover={setDragOverDate}
                    variant={variant}
                  />
                );
              })}

              <MediaJourneyOverlay
                segments={segments}
                variant={variant}
                linePad={linePad}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
