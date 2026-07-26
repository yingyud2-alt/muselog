"use client";

import { useCallback } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
import {
  buildJournalItemFromMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { removeMemory, upsertMemory } from "@/lib/content/memory-store";
import type { RatingFormValues } from "@/lib/content/user-media-state";
import {
  removeUserMediaState,
  upsertUserMediaState,
} from "@/lib/content/user-media-state";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import type { LibraryItem } from "@/lib/library/library-types";

export function useLibraryItemActions(item: LibraryItem | null) {
  const { entries, addEntry, removeEntry } = useJournalEntries();
  const journalItemId = item ? resolveJournalItemId(item.mediaKey) : "";
  const journalItem =
    entries.find((entry) => entry.id === journalItemId) ?? null;

  const syncMemory = useCallback(
    (status: LibraryItem["status"], partial?: { rating?: number; note?: string }) => {
      if (!item?.contentId) return;

      if (status === "NONE" as never) {
        removeMemory(item.contentId);
        return;
      }

      const memoryStatus =
        status === "WANT"
          ? "WANT"
          : status === "ONGOING"
            ? "READING"
            : "COMPLETED";

      upsertMemory({
        contentId: item.contentId,
        status: memoryStatus,
        rating: partial?.rating,
        note: partial?.note,
      });
    },
    [item],
  );

  const startNow = useCallback(() => {
    if (!item) return;

    const today = getDisplayTodayString();
    const journalEntry = buildJournalItemFromMediaKey(
      item.mediaKey,
      {
        status: "READING",
        date: today,
        startDate: today,
        endDate: undefined,
        note: item.notes ?? item.shortReview ?? "",
        rating: item.rating ?? 0,
      },
      {
        title: item.title,
        creator: item.creator,
        cover: item.cover,
        type: item.type,
      },
    );

    addEntry(journalEntry);
    upsertUserMediaState(item.mediaKey, {
      status: "ONGOING",
      startDate: today,
      endDate: undefined,
      addedToJournal: true,
      title: item.title,
      creator: item.creator,
      cover: item.cover,
      mediaType: item.type,
    });
    syncMemory("ONGOING");
  }, [item, addEntry, syncMemory]);

  const updateProgress = useCallback(
    (progress: number) => {
      if (!item) return;
      const clamped = Math.max(0, Math.min(100, progress));

      upsertUserMediaState(item.mediaKey, {
        status: "ONGOING",
        progress: clamped,
        title: item.title,
        creator: item.creator,
        cover: item.cover,
        mediaType: item.type,
      });

      if (journalItem) {
        addEntry({ ...journalItem, status: "READING" });
      }
    },
    [item, journalItem, addEntry],
  );

  const saveRating = useCallback(
    (values: RatingFormValues) => {
      if (!item) return;

      const completedDate = values.completedDate || getDisplayTodayString();
      const startDate = item.startDate ?? journalItem?.startDate ?? completedDate;

      const journalEntry = buildJournalItemFromMediaKey(
        item.mediaKey,
        {
          status: "FINISHED",
          date: completedDate,
          startDate,
          endDate: completedDate,
          rating: values.rating,
          note: values.shortReview ?? item.notes ?? item.shortReview ?? "",
        },
        {
          title: item.title,
          creator: item.creator,
          cover: item.cover,
          type: item.type,
        },
      );

      addEntry(journalEntry);
      upsertUserMediaState(item.mediaKey, {
        status: "FINISHED",
        progress: 100,
        rating: values.rating,
        shortReview: values.shortReview,
        startDate,
        endDate: completedDate,
        addedToJournal: true,
        title: item.title,
        creator: item.creator,
        cover: item.cover,
        mediaType: item.type,
      });
      syncMemory("FINISHED", {
        rating: values.rating,
        note: values.shortReview,
      });
    },
    [item, journalItem, addEntry, syncMemory],
  );

  const removeFromList = useCallback(() => {
    if (!item) return;
    removeUserMediaState(item.mediaKey);
    if (item.contentId) removeMemory(item.contentId);
    if (journalItem?.status === "WANT") {
      removeEntry(journalItemId);
    }
  }, [item, journalItem, journalItemId, removeEntry]);

  const removeFromLibrary = useCallback(() => {
    if (!item) return;
    removeUserMediaState(item.mediaKey);
    if (item.contentId) removeMemory(item.contentId);
  }, [item]);

  const experienceAgain = useCallback(() => {
    if (!item) return;

    const today = getDisplayTodayString();
    const journalEntry = buildJournalItemFromMediaKey(
      item.mediaKey,
      {
        status: "READING",
        date: today,
        startDate: today,
        endDate: undefined,
        rating: item.rating ?? 0,
        note: item.shortReview
          ? `${item.shortReview}\n— Revisited ${today}`
          : `Revisited ${today}`,
      },
      {
        title: item.title,
        creator: item.creator,
        cover: item.cover,
        type: item.type,
      },
    );

    addEntry(journalEntry);
    upsertUserMediaState(item.mediaKey, {
      status: "ONGOING",
      startDate: today,
      endDate: undefined,
      progress: undefined,
      addedToJournal: true,
      title: item.title,
      creator: item.creator,
      cover: item.cover,
      mediaType: item.type,
    });
    syncMemory("ONGOING");
  }, [item, addEntry, syncMemory]);

  const updateNotes = useCallback(
    (notes: string) => {
      if (!item) return;

      upsertUserMediaState(item.mediaKey, {
        notes,
        title: item.title,
        creator: item.creator,
        cover: item.cover,
        mediaType: item.type,
        status: item.status,
      });

      if (journalItem) {
        addEntry({ ...journalItem, note: notes });
      }
    },
    [item, journalItem, addEntry],
  );

  return {
    startNow,
    updateProgress,
    saveRating,
    removeFromList,
    removeFromLibrary,
    experienceAgain,
    updateNotes,
  };
}
