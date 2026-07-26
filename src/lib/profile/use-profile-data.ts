"use client";

import { useMemo } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
import { DISPLAY_REFERENCE_DATE } from "@/lib/display-date";
import { useHabitLogs } from "@/lib/habit/habit-store";
import { useImportHistory } from "@/lib/import/import-batch-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { getUserContentById } from "@/lib/content/user-content-store";
import {
  buildContentTagsMap,
  calculateCurrentJourney,
  calculateFavorites,
  calculateIdentity,
  calculateMediaStats,
  calculateMonthlyReflection,
  calculateTasteTags,
  calculateTimeline,
} from "@/lib/profile/profile-utils";

export function useProfileData() {
  const { allItems } = useLibraryItems();
  const { entries: journalEntries } = useJournalEntries();
  const { logs: habitLogs } = useHabitLogs();
  const importHistory = useImportHistory();

  const contentTagsByKey = useMemo(() => {
    const base = buildContentTagsMap(allItems);

    for (const item of allItems) {
      const userContent = getUserContentById(item.mediaKey);
      if (userContent?.tags?.length) {
        base[item.mediaKey] = [...(base[item.mediaKey] ?? []), ...userContent.tags];
      }
    }

    return base;
  }, [allItems]);

  const year = DISPLAY_REFERENCE_DATE.getUTCFullYear();
  const month = DISPLAY_REFERENCE_DATE.getUTCMonth() + 1;

  const stats = useMemo(() => calculateMediaStats(allItems), [allItems]);
  const identity = useMemo(
    () => calculateIdentity(allItems, importHistory),
    [allItems, importHistory],
  );
  const currentJourney = useMemo(
    () => calculateCurrentJourney(allItems),
    [allItems],
  );
  const reflection = useMemo(
    () => calculateMonthlyReflection(journalEntries, habitLogs, year, month),
    [journalEntries, habitLogs, year, month],
  );
  const tasteTags = useMemo(
    () => calculateTasteTags(allItems, journalEntries, contentTagsByKey),
    [allItems, journalEntries, contentTagsByKey],
  );
  const favorites = useMemo(
    () => calculateFavorites(allItems),
    [allItems],
  );
  const timeline = useMemo(
    () => calculateTimeline(journalEntries),
    [journalEntries],
  );

  return {
    stats,
    identity,
    currentJourney,
    reflection,
    tasteTags,
    favorites,
    timeline,
    getItemByKey: (mediaKey: string) =>
      allItems.find((item) => item.mediaKey === mediaKey) ?? null,
  };
}
