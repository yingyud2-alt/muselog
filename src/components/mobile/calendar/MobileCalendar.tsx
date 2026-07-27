"use client";

import { useCallback, useMemo, useState } from "react";

import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { JournalAddPanel } from "@/components/calendar/journal-add-panel";
import { ReflectionEntryLink } from "@/components/reflection/reflection-entry-link";
import { MonthSummary } from "@/components/calendar/MonthSummary";
import { HabitStatCards } from "@/components/habit/HabitStatCards";
import {
  CALENDAR_DEFAULT_MONTH,
  CALENDAR_DEFAULT_YEAR,
} from "@/lib/calendar/constants";
import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import { moveJourneyToStartDate } from "@/lib/calendar/calendar-event-layout";
import { upsertJournalEntry } from "@/lib/calendar/journal-store";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { formatMonthYear } from "@/lib/calendar/utils";
import {
  mediaKeyFromJournalItemId,
  mediaTypeToContentType,
} from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { MEDIA_EXPLORE_IDS, type MediaItem } from "@/types/media";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

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

export function MobileCalendar() {
  const [addDate, setAddDate] = useState<string | null>(null);
  const { items } = useCalendarMedia();
  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const monthLabel = formatMonthYear(
    CALENDAR_DEFAULT_YEAR,
    CALENDAR_DEFAULT_MONTH,
  );
  const today = getDisplayTodayString();

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

  return (
    <div>
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
          onSelectDate={setAddDate}
          onOpenEntry={openEntryQuickMemory}
          onMoveCover={handleMoveCover}
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
    </div>
  );
}
