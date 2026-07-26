"use client";

import { useMemo } from "react";

import {
  buildMonthGrid,
  getWeekdayLabels,
} from "@/lib/calendar/utils";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";

import { MobileCalendarDay } from "./MobileCalendarDay";

type MobileMonthViewProps = {
  year: number;
  month: number;
  today: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export function MobileMonthView({
  year,
  month,
  today,
  selectedDate,
  onSelectDate,
}: MobileMonthViewProps) {
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekdayLabels = getWeekdayLabels();
  const { items } = useCalendarMedia();

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-[9px] font-medium uppercase tracking-[0.14em] text-white/35"
          >
            {label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1">
            {week.days.map((cell, cellIndex) => {
              if (!cell.date || !cell.day) {
                return <div key={`${weekIndex}-${cellIndex}`} aria-hidden="true" />;
              }

              return (
                <MobileCalendarDay
                  key={`${weekIndex}-${cellIndex}`}
                  date={cell.date}
                  day={cell.day}
                  isCurrentMonth={cell.isCurrentMonth}
                  isToday={cell.date === today}
                  isSelected={cell.date === selectedDate}
                  items={items}
                  onSelectDate={() => onSelectDate(cell.date!)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
