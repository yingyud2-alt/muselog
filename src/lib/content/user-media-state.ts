"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  buildJournalItemFromWork,
  findCatalogContentForBubble,
  resolveBubbleMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { removeMemory, upsertMemory } from "@/lib/content/memory-store";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import type { JourneyColor, MediaItem, MediaStatus } from "@/types/media";

export type UserMediaStatus = "NONE" | "WANT" | "ONGOING" | "FINISHED";

export interface UserMediaState {
  mediaKey: string;
  status: UserMediaStatus;
  rating?: number;
  shortReview?: string;
  startDate?: string;
  endDate?: string;
  addedToJournal: boolean;
  journeyColor?: JourneyColor;
}

export type JournalFormValues = {
  startDate: string;
  endDate?: string;
  plannedStatus: "planned" | "ongoing" | "finished";
  journeyColor: JourneyColor;
  note?: string;
};

export type RatingFormValues = {
  rating: number;
  completedDate: string;
  shortReview?: string;
};

const STORAGE_KEY = "muselog-user-media-state-v1";
const EMPTY: Record<string, UserMediaState> = {};

let cached: Record<string, UserMediaState> = EMPTY;
let initialized = false;

function read(): Record<string, UserMediaState> {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;

    const parsed = JSON.parse(raw) as Record<string, UserMediaState>;
    return parsed && typeof parsed === "object" ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  cached = read();
  initialized = true;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();

  const handler = () => {
    cached = read();
    initialized = true;
    cb();
  };

  window.addEventListener("muselog-user-media-updated", handler);
  return () =>
    window.removeEventListener("muselog-user-media-updated", handler);
}

function write(next: Record<string, UserMediaState>) {
  cached = next;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("muselog-user-media-updated"));
}

function upsertState(mediaKey: string, partial: Partial<UserMediaState>) {
  ensureInit();
  const current = cached[mediaKey];
  const nextState: UserMediaState = {
    mediaKey,
    status: partial.status ?? current?.status ?? "NONE",
    rating: partial.rating ?? current?.rating,
    shortReview: partial.shortReview ?? current?.shortReview,
    startDate: partial.startDate ?? current?.startDate,
    endDate: partial.endDate ?? current?.endDate,
    addedToJournal: partial.addedToJournal ?? current?.addedToJournal ?? false,
    journeyColor: partial.journeyColor ?? current?.journeyColor,
  };

  write({ ...cached, [mediaKey]: nextState });
  return nextState;
}

function removeState(mediaKey: string) {
  ensureInit();
  if (!cached[mediaKey]) return;
  const next = { ...cached };
  delete next[mediaKey];
  write(next);
}

function syncMemoryStore(work: WorkBubble, state: UserMediaState) {
  const content = findCatalogContentForBubble(work);
  if (!content) return;

  if (state.status === "NONE") {
    removeMemory(content.id);
    return;
  }

  const memoryStatus =
    state.status === "WANT"
      ? "WANT"
      : state.status === "ONGOING"
        ? "READING"
        : "COMPLETED";

  upsertMemory({
    contentId: content.id,
    status: memoryStatus,
    rating: state.rating,
    note: state.shortReview,
  });
}

function journalStatusToUserStatus(status: MediaStatus): UserMediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "READING") return "ONGOING";
  return "FINISHED";
}

function resolveEffectiveState(
  mediaKey: string,
  journalItem: MediaItem | null,
  storedOverride?: UserMediaState,
): UserMediaState {
  ensureInit();
  const stored = storedOverride ?? cached[mediaKey];

  if (journalItem) {
    return {
      mediaKey,
      status: journalStatusToUserStatus(journalItem.status),
      rating: journalItem.rating > 0 ? journalItem.rating : stored?.rating,
      shortReview: journalItem.note || stored?.shortReview,
      startDate: journalItem.startDate ?? journalItem.date ?? stored?.startDate,
      endDate: journalItem.endDate ?? stored?.endDate,
      addedToJournal: true,
      journeyColor: journalItem.journeyColor ?? stored?.journeyColor,
    };
  }

  return (
    stored ?? {
      mediaKey,
      status: "NONE",
      addedToJournal: false,
    }
  );
}

export function getWantListContentIds(): Set<string> {
  ensureInit();
  const ids = new Set<string>();

  for (const state of Object.values(cached)) {
    if (state.status === "WANT" && !state.mediaKey.startsWith("bubble-")) {
      ids.add(state.mediaKey);
    }
  }

  return ids;
}

export function useUserMediaStateMap() {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => EMPTY,
  );
}

export function useBubbleMediaState(work: WorkBubble | null) {
  const stateMap = useUserMediaStateMap();
  const { entries, addEntry, removeEntry } = useJournalEntries();

  const mediaKey = work ? resolveBubbleMediaKey(work) : "";
  const journalItemId = work ? resolveJournalItemId(mediaKey) : "";

  const journalItem = useMemo(
    () => entries.find((entry) => entry.id === journalItemId) ?? null,
    [entries, journalItemId],
  );

  const storedState = stateMap[mediaKey];

  const state = useMemo(
    () => (work ? resolveEffectiveState(mediaKey, journalItem, storedState) : null),
    [work, mediaKey, journalItem, storedState],
  );

  const toggleWant = useCallback(() => {
    if (!work) return;

    const current = resolveEffectiveState(mediaKey, journalItem);

    if (current.status === "WANT") {
      removeState(mediaKey);
      if (journalItem) {
        removeEntry(journalItemId);
      }
      syncMemoryStore(work, { ...current, status: "NONE", addedToJournal: false });
      return;
    }

    if (current.status === "ONGOING" || current.status === "FINISHED") {
      return;
    }

    const next: UserMediaState = {
      mediaKey,
      status: "WANT",
      addedToJournal: false,
    };
    upsertState(mediaKey, next);
    syncMemoryStore(work, next);
  }, [work, mediaKey, journalItem, journalItemId, removeEntry]);

  const saveJournal = useCallback(
    (values: JournalFormValues) => {
      if (!work) return;

      const today = getDisplayTodayString();
      let status: MediaStatus = "READING";
      let startDate = values.startDate || today;
      let endDate: string | undefined = values.endDate || undefined;

      if (values.plannedStatus === "planned") {
        status = "WANT";
        startDate = values.startDate || today;
        endDate = undefined;
      } else if (values.plannedStatus === "ongoing") {
        status = "READING";
        endDate = undefined;
      } else {
        status = "FINISHED";
        endDate = values.endDate || today;
        if (!values.startDate) {
          startDate = endDate;
        }
      }

      const item = buildJournalItemFromWork(work, {
        status,
        date: startDate,
        startDate,
        endDate,
        journeyColor: values.journeyColor,
        note: values.note ?? "",
        rating: journalItem?.rating ?? 0,
      });

      addEntry(item);

      const userStatus: UserMediaStatus =
        status === "WANT"
          ? "WANT"
          : status === "READING"
            ? "ONGOING"
            : "FINISHED";

      const next: UserMediaState = {
        mediaKey,
        status: userStatus,
        startDate,
        endDate,
        addedToJournal: true,
        journeyColor: values.journeyColor,
        shortReview: values.note,
      };

      upsertState(mediaKey, next);
      syncMemoryStore(work, next);
    },
    [work, mediaKey, journalItem, addEntry],
  );

  const saveRating = useCallback(
    (values: RatingFormValues) => {
      if (!work) return;

      const completedDate = values.completedDate || getDisplayTodayString();
      const startDate =
        journalItem?.startDate ??
        journalItem?.date ??
        cached[mediaKey]?.startDate ??
        completedDate;

      const item = buildJournalItemFromWork(work, {
        status: "FINISHED",
        date: completedDate,
        startDate,
        endDate: completedDate,
        journeyColor:
          journalItem?.journeyColor ??
          cached[mediaKey]?.journeyColor,
        note: values.shortReview ?? journalItem?.note ?? "",
        rating: values.rating,
      });

      addEntry(item);

      const next: UserMediaState = {
        mediaKey,
        status: "FINISHED",
        rating: values.rating,
        shortReview: values.shortReview,
        startDate,
        endDate: completedDate,
        addedToJournal: true,
        journeyColor: item.journeyColor,
      };

      upsertState(mediaKey, next);
      syncMemoryStore(work, next);
    },
    [work, mediaKey, journalItem, addEntry],
  );

  return {
    state,
    journalItem,
    mediaKey,
    toggleWant,
    saveJournal,
    saveRating,
  };
}
