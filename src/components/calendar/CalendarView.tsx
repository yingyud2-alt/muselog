"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { JournalAddPanel } from "@/components/calendar/journal-add-panel";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { MemoryRiverEntry } from "@/components/calendar/memory-river-entry";
import { ReflectionEntryLink } from "@/components/reflection/reflection-entry-link";
import {
  MonthHeader,
  type CalendarViewMode,
} from "@/components/calendar/MonthHeader";
import { MonthSummary } from "@/components/calendar/MonthSummary";
import { HabitStatCards } from "@/components/habit/HabitStatCards";
import {
  CALENDAR_DEFAULT_MONTH,
  CALENDAR_DEFAULT_YEAR,
} from "@/lib/calendar/constants";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { dateHasJournalMedia } from "@/lib/calendar/journey-utils";
import {
  formatMonthYear,
  sortMediaByDateDesc,
} from "@/lib/calendar/utils";
import type { MediaItem } from "@/types/media";

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { items } = useCalendarMedia();

  const monthLabel = formatMonthYear(CALENDAR_DEFAULT_YEAR, CALENDAR_DEFAULT_MONTH);
  const riverItems = useMemo(() => sortMediaByDateDesc(items), [items]);

  const openItem = useCallback((item: MediaItem, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelectedItem(item);
  }, []);

  const closeItem = useCallback(() => {
    setSelectedItem(null);

    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  const handleSelectDate = useCallback(
    (date: string) => {
      if (dateHasJournalMedia(date, items)) {
        const match = items.find((item) => {
          const start = item.startDate ?? item.date;
          const end = item.endDate ?? start;
          return date >= start && date <= end;
        });

        if (match) {
          setSelectedItem(match);
        }
        return;
      }

      setAddDate(date);
    },
    [items],
  );

  const showMonthGrid = viewMode === "month";
  const showRiver = viewMode === "timeline";

  return (
    <>
      <MonthHeader
        monthLabel={monthLabel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3 md:px-8">
        <ReflectionEntryLink />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-5">
        {showMonthGrid && (
          <section>
            <CalendarMonthGrid
              year={CALENDAR_DEFAULT_YEAR}
              month={CALENDAR_DEFAULT_MONTH}
              items={items}
              onSelectDate={handleSelectDate}
              onSelectItem={openItem}
              variant="desktop"
              className="min-h-[calc(100svh-4.75rem)]"
            />

            <HabitStatCards
              year={CALENDAR_DEFAULT_YEAR}
              month={CALENDAR_DEFAULT_MONTH}
              className="mt-8"
            />

            <MonthSummary
              year={CALENDAR_DEFAULT_YEAR}
              month={CALENDAR_DEFAULT_MONTH}
              memories={items}
              className="mt-10"
            />
          </section>
        )}

        {showRiver && (
          <section>
            <div className="relative md:mx-auto md:max-w-4xl md:px-4">
              {riverItems.map((memory, index) => (
                <MemoryRiverEntry
                  key={memory.id}
                  memory={memory}
                  index={index}
                  onSelect={openItem}
                />
              ))}
            </div>

            <MonthSummary
              year={CALENDAR_DEFAULT_YEAR}
              month={CALENDAR_DEFAULT_MONTH}
              memories={items}
              className="mt-10"
            />
          </section>
        )}
      </div>

      <MediaFloatingDetail item={selectedItem} onClose={closeItem} />
      <JournalAddPanel
        date={addDate}
        journalItems={items}
        onClose={() => setAddDate(null)}
      />
    </>
  );
}
