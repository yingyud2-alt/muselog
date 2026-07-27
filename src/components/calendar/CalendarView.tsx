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
import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import { moveJourneyToStartDate } from "@/lib/calendar/calendar-event-layout";
import { upsertJournalEntry } from "@/lib/calendar/journal-store";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { sortMediaByDateDesc } from "@/lib/calendar/utils";
import {
  mediaKeyFromJournalItemId,
  mediaTypeToContentType,
} from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { MEDIA_EXPLORE_IDS, type MediaItem } from "@/types/media";

function resolveWorkIdForEntry(item: MediaItem): string {
  if (MEDIA_EXPLORE_IDS[item.id]) return MEDIA_EXPLORE_IDS[item.id];
  if (item.id.startsWith("journal-")) {
    return mediaKeyFromJournalItemId(item.id);
  }
  if (item.id.startsWith("checkin-")) return "";
  return item.id;
}

function openEntryQuickMemory(item: MediaItem) {
  openJournalQuickLog(resolveWorkIdForEntry(item), {
    entryId: item.id,
    initialDate:
      normalizeCalendarDate(item.startDate) ??
      normalizeCalendarDate(item.date) ??
      undefined,
    snapshot: {
      title: item.title,
      creator: item.creator,
      type: mediaTypeToContentType(item.type),
      cover: item.cover,
      tags: item.tags,
    },
  });
}

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [addDate, setAddDate] = useState<string | null>(null);
  const { items } = useCalendarMedia();
  const { year, month, monthLabel, goPrev, goNext } = useActiveMonth();

  const riverItems = useMemo(() => sortMediaByDateDesc(items), [items]);
  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const handleOpenEntry = useCallback((item: MediaItem) => {
    openEntryQuickMemory(item);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setAddDate(date);
  }, []);

  const handleMoveCover = useCallback(
    (itemId: string, date: string) => {
      const item = itemsById.get(itemId);
      const nextStart = normalizeCalendarDate(date);
      if (!item || !nextStart) return;
      const next = moveJourneyToStartDate(item, nextStart);
      if (next === item) return;
      upsertJournalEntry(next);
    },
    [itemsById],
  );

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
                <p className="font-label mb-3 text-center text-[11px] leading-relaxed tracking-[0.04em] text-white/32 md:mb-4">
                  Click a day to add a memory. Drag a cover onto another date to
                  move when the journey began.
                </p>

                <CalendarMonthGrid
                  year={year}
                  month={month}
                  items={items}
                  today={getDisplayTodayString()}
                  selectedDate={addDate}
                  onSelectDate={handleSelectDate}
                  onOpenEntry={handleOpenEntry}
                  onMoveCover={handleMoveCover}
                  variant="desktop"
                />

                <QuickCheckIn density="compact" className="mt-8" />

                <HabitStatCards year={year} month={month} className="mt-8" />

                <JourneyOverview
                  items={items}
                  year={year}
                  month={month}
                  onSelectItem={(item) => openEntryQuickMemory(item)}
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
                      onSelect={(item) => openEntryQuickMemory(item)}
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
