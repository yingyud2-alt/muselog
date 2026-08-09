"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import { moveJourneyToStartDate } from "@/lib/calendar/calendar-event-layout";
import {
  getJourneyColor,
  getJourneyEnd,
  getJourneyStart,
  mergeMediaWithJourneyOverrides,
} from "@/lib/calendar/journey-utils";
import {
  upsertJournalEntry,
  useHiddenJournalIds,
  useJournalEntries,
} from "@/lib/calendar/journal-store";
import { bindJournalEntryCoverFromWork } from "@/lib/calendar/resolve-journal-work-cover";
import {
  isDisplayableJournalEntry,
  logUnresolvedLegacyJournalEntries,
} from "@/lib/work/displayable-api-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import { mediaItemToWork } from "@/lib/work/work-adapters";
import type { JourneyColor, MediaItem } from "@/types/media";

const STORAGE_KEY = "muselog-media-journeys-v1";

type JourneyOverride = {
  startDate: string;
  endDate: string;
  journeyColor: JourneyColor;
};

type JourneyOverrideRecord = Record<string, JourneyOverride>;

const EMPTY_RECORD: JourneyOverrideRecord = {};

let cachedRecord: JourneyOverrideRecord = EMPTY_RECORD;
let cacheInitialized = false;

function readOverrides(): JourneyOverrideRecord {
  if (typeof window === "undefined") {
    return EMPTY_RECORD;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_RECORD;
    }

    const parsed = JSON.parse(raw) as JourneyOverrideRecord;

    return parsed && typeof parsed === "object" ? parsed : EMPTY_RECORD;
  } catch {
    return EMPTY_RECORD;
  }
}

function ensureCacheInitialized(): void {
  if (cacheInitialized || typeof window === "undefined") {
    return;
  }

  cachedRecord = readOverrides();
  cacheInitialized = true;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureCacheInitialized();

  const handleUpdate = () => {
    cachedRecord = readOverrides();
    cacheInitialized = true;
    callback();
  };

  window.addEventListener("muselog-journey-updated", handleUpdate);

  return () => {
    window.removeEventListener("muselog-journey-updated", handleUpdate);
  };
}

function getSnapshot(): JourneyOverrideRecord {
  ensureCacheInitialized();
  return cachedRecord;
}

function writeOverrides(record: JourneyOverrideRecord): void {
  cachedRecord = record;
  cacheInitialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent("muselog-journey-updated"));
}

function recordToMap(record: JourneyOverrideRecord): Map<string, JourneyOverride> {
  return new Map(Object.entries(record));
}

export function useCalendarMedia() {
  const overrideRecord = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY_RECORD,
  );
  const { entries: userEntries, addEntry } = useJournalEntries();
  const hiddenList = useHiddenJournalIds();
  const hiddenIds = useMemo(() => new Set(hiddenList), [hiddenList]);
  // Re-bind covers when Explore/API imports update Work.coverUrl.
  const importedMap = useImportedWorkMap();

  const baseItems = useMemo(() => {
    // Production calendar: user journal only — never inject CALENDAR_MOCK_MEDIA.
    const visible = userEntries.filter((item) => !hiddenIds.has(item.id));
    logUnresolvedLegacyJournalEntries(visible);
    return visible.filter((item) => isDisplayableJournalEntry(item));
  }, [userEntries, hiddenIds, importedMap]);

  const items = useMemo(() => {
    const merged = mergeMediaWithJourneyOverrides(
      baseItems,
      recordToMap(overrideRecord),
    );
    return merged
      .map((item) => bindJournalEntryCoverFromWork(item, importedMap))
      .filter((item) => isDisplayableJournalEntry(item));
  }, [baseItems, overrideRecord, importedMap]);

  /** Unified Work view of journal calendar entries. */
  const works = useMemo(() => items.map((item) => mediaItemToWork(item)), [items]);

  const saveJourney = useCallback(
    (
      mediaId: string,
      startDate: string,
      endDate: string,
      journeyColor: JourneyColor,
    ) => {
      ensureCacheInitialized();
      writeOverrides({
        ...cachedRecord,
        [mediaId]: { startDate, endDate, journeyColor },
      });
    },
    [],
  );

  /**
   * Drag → drop onto a calendar day.
   * Updates journal entry dates and journey overrides, then persists both.
   */
  const moveEntryToDate = useCallback(
    (itemId: string, date: string) => {
      const item = items.find((entry) => entry.id === itemId);
      const nextStart = normalizeCalendarDate(date);
      if (!item || !nextStart) return;

      const next = moveJourneyToStartDate(item, nextStart);
      if (next === item) return;

      upsertJournalEntry(next);
      saveJourney(
        next.id,
        getJourneyStart(next),
        getJourneyEnd(next),
        getJourneyColor(next),
      );
    },
    [items, saveJourney],
  );

  return {
    items,
    works,
    saveJourney,
    moveEntryToDate,
    addJournalEntry: addEntry,
  };
}

export type { MediaItem };
