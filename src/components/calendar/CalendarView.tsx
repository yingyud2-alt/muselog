"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { JournalAddPanel } from "@/components/calendar/journal-add-panel";
import { MemoryRiverEntry } from "@/components/calendar/memory-river-entry";
import { JourneyOverview } from "@/components/journal/journey-overview";
import { QuickCheckIn } from "@/components/journal/quick-check-in";
import {
  MonthHeader,
  type CalendarViewMode,
} from "@/components/calendar/MonthHeader";
import { MonthSummary } from "@/components/calendar/MonthSummary";
import { HabitStatCards } from "@/components/habit/HabitStatCards";
import { useActiveMonth } from "@/lib/calendar/active-month-store";
import { openJournalCalendarWorkDetail } from "@/lib/calendar/open-journal-work-detail";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { sortMediaByDateDesc } from "@/lib/calendar/utils";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import type { MediaItem } from "@/types/media";

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [addDate, setAddDate] = useState<string | null>(null);
  const { items, moveEntryToDate } = useCalendarMedia();
  const { year, month, monthLabel, goPrev, goNext } = useActiveMonth();

  const riverItems = useMemo(() => sortMediaByDateDesc(items), [items]);

  const handleOpenEntry = useCallback((item: MediaItem) => {
    openJournalCalendarWorkDetail(item);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setAddDate(date);
  }, []);

  const showMonthGrid = viewMode === "month";
  const showRiver = viewMode === "timeline";

  return (
    <div>
      <MonthHeader
        monthLabel={monthLabel}
        onPrevMonth={goPrev}
        onNextMonth={goNext}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}-${viewMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {showMonthGrid && (
              <section>
                <p className="font-label mb-4 text-center text-[11px] leading-relaxed tracking-[0.04em] text-white/30 md:mb-5">
                  Tap a day to add a memory. Drag a card to another date to move it.
                </p>

                <CalendarMonthGrid
                  year={year}
                  month={month}
                  items={items}
                  today={getDisplayTodayString()}
                  selectedDate={addDate}
                  onSelectDate={handleSelectDate}
                  onOpenEntry={handleOpenEntry}
                  onMoveCover={moveEntryToDate}
                  variant="desktop"
                />

                <QuickCheckIn density="compact" className="mt-8" />

                <HabitStatCards year={year} month={month} className="mt-8" />

                <JourneyOverview
                  items={items}
                  year={year}
                  month={month}
                  onSelectItem={(item) => openJournalCalendarWorkDetail(item)}
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
                      onSelect={(item) => openJournalCalendarWorkDetail(item)}
                    />
                  ))}
                </div>

                <MonthSummary
                  year={year}
                  month={month}
                  memories={items}
                  className="mt-10"
                />
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <JournalAddPanel
        date={addDate}
        journalItems={items}
        onClose={() => setAddDate(null)}
      />
    </div>
  );
}
