"use client";

import { useMemo } from "react";

import { useActiveMonth } from "@/lib/calendar/active-month-store";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getUserContentById } from "@/lib/content/user-content-store";
import { useHabitLogs } from "@/lib/habit/habit-store";
import {
  buildReflectionPreview,
  generateReflectionInsight,
} from "@/lib/reflection/reflection-generator";
import type { MonthlyReflectionData } from "@/lib/reflection/reflection-types";
import {
  buildReflectionContentTagsMap,
  calculateMonthJourney,
  calculateMonthlyStats,
  calculateMoodSummary,
  calculateReflectionTasteTags,
  filterMonthJournalEntries,
  formatReflectionMonthName,
  formatReflectionMonthYear,
  getMonthLibraryActivity,
} from "@/lib/reflection/reflection-utils";
import { useLibraryItems } from "@/lib/library/use-library-items";

export function useReflectionData(
  yearOverride?: number,
  monthOverride?: number,
): MonthlyReflectionData {
  const { allItems } = useLibraryItems();
  const { entries: journalEntries } = useJournalEntries();
  const { logs: habitLogs } = useHabitLogs();
  const activeMonth = useActiveMonth();

  const year = yearOverride ?? activeMonth.year;
  const month = monthOverride ?? activeMonth.month;

  return useMemo(() => {
    const monthName = formatReflectionMonthName(month);
    const monthYear = formatReflectionMonthYear(year, month);
    const monthJournalEntries = filterMonthJournalEntries(
      journalEntries,
      year,
      month,
    );

    const { completedWorks, ongoingWorks, activeItems } = getMonthLibraryActivity(
      allItems,
      year,
      month,
    );

    const contentTagsByKey = buildReflectionContentTagsMap(allItems);
    for (const item of activeItems) {
      const userContent = getUserContentById(item.mediaKey);
      if (userContent?.tags?.length) {
        contentTagsByKey[item.mediaKey] = [
          ...(contentTagsByKey[item.mediaKey] ?? []),
          ...userContent.tags,
        ];
      }
    }

    const mediaStats = calculateMonthlyStats(
      journalEntries,
      habitLogs,
      allItems,
      year,
      month,
    );
    const journey = calculateMonthJourney(journalEntries, year, month);
    const tasteTags = calculateReflectionTasteTags(
      monthJournalEntries,
      activeItems,
      contentTagsByKey,
    );
    const moodTags = calculateMoodSummary(
      monthJournalEntries,
      habitLogs,
      year,
      month,
    );

    const reflection = generateReflectionInsight({
      month: monthName,
      monthYear,
      mediaStats,
      completedWorks,
      ongoingWorks,
      tasteTags,
      moodTags,
      journalEntries: monthJournalEntries,
    });

    const preview = buildReflectionPreview(monthName, monthYear, reflection);

    return {
      month: monthName,
      monthYear,
      mediaStats,
      journey,
      tasteTags,
      moodTags,
      completedWorks,
      ongoingWorks,
      monthJournalEntries,
      reflection,
      preview,
    };
  }, [allItems, journalEntries, habitLogs, year, month]);
}

export function useReflectionPreview() {
  const data = useReflectionData();
  return data.preview;
}
