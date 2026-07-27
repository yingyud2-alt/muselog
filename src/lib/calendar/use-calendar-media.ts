"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { mergeMediaWithJourneyOverrides } from "@/lib/calendar/journey-utils";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { mediaItemToWork } from "@/lib/work/work-adapters";
import { CALENDAR_MOCK_MEDIA } from "@/types/media";
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

  const baseItems = useMemo(() => {
    const mockIds = new Set(CALENDAR_MOCK_MEDIA.map((item) => item.id));
    const userById = new Map(userEntries.map((item) => [item.id, item]));
    // Prefer journal-store overrides of mock seeds (drag/resize persistence).
    const mocks = CALENDAR_MOCK_MEDIA.map(
      (item) => userById.get(item.id) ?? item,
    );
    const added = userEntries.filter((item) => !mockIds.has(item.id));
    return [...mocks, ...added];
  }, [userEntries]);

  const items = useMemo(
    () => mergeMediaWithJourneyOverrides(baseItems, recordToMap(overrideRecord)),
    [baseItems, overrideRecord],
  );

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

  return { items, works, saveJourney, addJournalEntry: addEntry };
}

export type { MediaItem };
