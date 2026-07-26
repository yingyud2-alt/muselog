"use client";

import { useMemo } from "react";

import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";
import { MediaJourneyOverlay } from "@/components/calendar/media-journey-overlay";
import {
  computeJourneySegments,
  DESKTOP_JOURNAL_OVERLAY,
  MOBILE_JOURNAL_OVERLAY,
} from "@/lib/calendar/journey-overlay-utils";
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
  onSelectItem: (item: MediaItem, trigger: HTMLElement) => void;
  variant?: "desktop" | "mobile";
  className?: string;
};

const BASE_ROW_HEIGHT = { desktop: 72, mobile: 64 } as const;

export function CalendarMonthGrid({
  year,
  month,
  items,
  today,
  selectedDate,
  onSelectDate,
  onSelectItem,
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
  const overlayConfig = isMobile ? MOBILE_JOURNAL_OVERLAY : DESKTOP_JOURNAL_OVERLAY;

  return (
    <div
      className={cn(
        isMobile
          ? "rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md"
          : "rounded-[28px] border border-white/[0.1] bg-white/[0.035] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md md:rounded-[32px] md:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 grid shrink-0 grid-cols-7 px-0.5",
          isMobile ? "mb-2 gap-1" : "mb-4 gap-1.5 md:gap-3",
        )}
      >
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className={cn(
              "text-center uppercase text-white/40",
              isMobile
                ? "text-[9px] font-medium tracking-[0.14em]"
                : "text-[9px] tracking-[0.16em] md:text-[10px] md:tracking-[0.18em]",
            )}
          >
            {label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div className={cn(isMobile ? "space-y-1" : "flex flex-col gap-1.5 md:gap-3")}>
        {weeks.map((week, weekIndex) => {
          const segments = segmentsByWeek.get(weekIndex) ?? [];
          const weekLanes =
            segments.length > 0
              ? Math.max(...segments.map((segment) => segment.lane)) + 1
              : 0;
          const weekOverlayPadding = weekLanes * overlayConfig.laneStep;
          const rowMinHeight =
            BASE_ROW_HEIGHT[variant] +
            overlayConfig.dateZoneHeight +
            weekOverlayPadding;

          return (
            <div
              key={`week-${weekIndex}`}
              className={cn(
                "relative grid grid-cols-7",
                isMobile ? "gap-1" : "gap-1.5 md:gap-3",
              )}
              style={{ minHeight: rowMinHeight }}
            >
              {week.days.map((cell, cellIndex) => {
                if (!cell.date || !cell.day) {
                  return (
                    <div
                      key={`${weekIndex}-${cellIndex}`}
                      className={cn(
                        "rounded-[14px] border border-white/[0.04] bg-white/[0.015]",
                        !isMobile && "md:min-h-[72px] md:rounded-[20px]",
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
                    onSelectDate={onSelectDate}
                    variant={variant}
                  />
                );
              })}

              <MediaJourneyOverlay
                segments={segments}
                onSelect={onSelectItem}
                variant={variant}
                dateZoneHeight={overlayConfig.dateZoneHeight}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
