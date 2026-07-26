"use client";

import { useState } from "react";

import { JournalAddPanel } from "@/components/calendar/journal-add-panel";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { ReflectionEntryLink } from "@/components/reflection/reflection-entry-link";
import { MonthSummary } from "@/components/calendar/MonthSummary";
import { HabitStatCards } from "@/components/habit/HabitStatCards";
import {
  CALENDAR_DEFAULT_MONTH,
  CALENDAR_DEFAULT_YEAR,
} from "@/lib/calendar/constants";
import { dateHasJournalMedia } from "@/lib/calendar/journey-utils";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { formatMonthYear } from "@/lib/calendar/utils";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

export function MobileCalendar() {
  const [addDate, setAddDate] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReturnType<typeof useCalendarMedia>["items"][0] | null>(null);
  const { items } = useCalendarMedia();

  const monthLabel = formatMonthYear(CALENDAR_DEFAULT_YEAR, CALENDAR_DEFAULT_MONTH);
  const today = getDisplayTodayString();

  const handleSelectDate = (date: string) => {
    if (dateHasJournalMedia(date, items)) {
      const match = items.find((item) => {
        const start = item.startDate ?? item.date;
        const end = item.endDate ?? start;
        return date >= start && date <= end;
      });
      if (match) setSelectedItem(match);
      return;
    }
    setAddDate(date);
  };

  return (
    <>
      <div
        className="min-h-[100svh] px-5 pt-[calc(env(safe-area-inset-top)+20px)]"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              Journal
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/92">
              {monthLabel}
            </h1>
          </div>
          <ReflectionEntryLink className="shrink-0" />
        </header>

        <CalendarMonthGrid
          year={CALENDAR_DEFAULT_YEAR}
          month={CALENDAR_DEFAULT_MONTH}
          items={items}
          today={today}
          selectedDate={addDate}
          onSelectDate={handleSelectDate}
          onSelectItem={(item) => setSelectedItem(item)}
          variant="mobile"
        />

        <HabitStatCards
          year={CALENDAR_DEFAULT_YEAR}
          month={CALENDAR_DEFAULT_MONTH}
          className="mt-6"
        />

        <MonthSummary
          year={CALENDAR_DEFAULT_YEAR}
          month={CALENDAR_DEFAULT_MONTH}
          memories={items}
          className="mt-8"
        />
      </div>

      <JournalAddPanel
        date={addDate}
        journalItems={items}
        onClose={() => setAddDate(null)}
      />

      <MediaFloatingDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
