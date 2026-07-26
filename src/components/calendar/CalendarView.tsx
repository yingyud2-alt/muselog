"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { JournalAddPanel } from "@/components/calendar/journal-add-panel";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
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
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { sortMediaByDateDesc } from "@/lib/calendar/utils";
import { openWorkDetail } from "@/lib/detail/detail-overlay-store";
import { workHrefForJournalItem } from "@/lib/work/work-route";
import type { MediaItem } from "@/types/media";

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { items } = useCalendarMedia();
  const { year, month, monthLabel, goPrev, goNext } = useActiveMonth();

  const riverItems = useMemo(() => sortMediaByDateDesc(items), [items]);

  const openItem = useCallback((item: MediaItem, trigger: HTMLElement) => {
    setAddDate(null);
    const workHref = workHrefForJournalItem(item);
    if (workHref) {
      const workId = workHref.replace(/^\/work\//, "");
      openWorkDetail(workId);
      return;
    }
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

  /** Empty day/cell space opens Add Memory; cover/card clicks open detail (higher priority). */
  const handleSelectDate = useCallback((date: string) => {
    setSelectedItem(null);
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
                <p className="font-label mb-4 text-center text-[11px] leading-relaxed tracking-[0.04em] text-white/32 md:mb-5">
                  Click any day to add a memory, reading, watching, or listening
                  journey.
                </p>

                <CalendarMonthGrid
                  year={year}
                  month={month}
                  items={items}
                  onSelectDate={handleSelectDate}
                  onSelectItem={openItem}
                  variant="desktop"
                  className="min-h-[calc(100svh-4.75rem)]"
                />

                <QuickCheckIn density="compact" className="mt-8" />

                <HabitStatCards year={year} month={month} className="mt-8" />

                <JourneyOverview
                  items={items}
                  year={year}
                  month={month}
                  onSelectItem={openItem}
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

      <MediaFloatingDetail item={selectedItem} onClose={closeItem} />
      <JournalAddPanel
        date={addDate}
        journalItems={items}
        onClose={() => setAddDate(null)}
      />
    </div>
  );
}
