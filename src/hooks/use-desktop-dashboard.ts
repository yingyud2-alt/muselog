"use client";

import { useMemo } from "react";

import {
  aiPicks,
  continueExploring,
  readingStats,
} from "@/components/dashboard/mock-data";
import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getUserContentById } from "@/lib/content/user-content-store";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { buildAiReflectionInput } from "@/lib/ai/build-ai-reflection-input";
import { sortLibraryItems } from "@/lib/library/library-items";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  buildContentTagsMap,
  calculateTasteTags,
} from "@/lib/profile/profile-utils";
import { useReflectionData } from "@/lib/reflection/use-reflection-data";
import type { ReflectionJourneyEntry } from "@/lib/reflection/reflection-types";

export type DashboardTimelineEntry = ReflectionJourneyEntry & {
  dayOfMonth: number;
  monthLabel: string;
  exploreHref?: string;
};

const MOCK_MOODS = ["quiet", "nostalgic", "reflective"];

const MOCK_REFLECTION_SUMMARY =
  "Your recent journey shows a preference for quiet stories, human relationships, and memory.";

const MOCK_TIMELINE_SPECS = [
  { catalogId: "book-norwegian-wood", day: 12, statusLabel: "Read" },
  { catalogId: "movie-perfect-days", day: 15, statusLabel: "Watched" },
  { catalogId: "music-carrie-and-lowell", day: 20, statusLabel: "Listened" },
] as const;

function buildMockTimeline(monthLabel: string): DashboardTimelineEntry[] {
  return MOCK_TIMELINE_SPECS.flatMap((spec) => {
    const catalog = CONTENT_CATALOG.find((entry) => entry.id === spec.catalogId);
    if (!catalog) return [];

    return [
      {
        id: `mock-${spec.catalogId}`,
        title: catalog.title,
        creator: catalog.creator,
        cover: catalog.cover,
        typeLabel: CONTENT_TYPE_LABELS[catalog.type],
        statusLabel: spec.statusLabel,
        date: `2026-07-${String(spec.day).padStart(2, "0")}`,
        dateLabel: `Jul ${spec.day}`,
        dayOfMonth: spec.day,
        monthLabel,
        exploreHref: `/explore/${catalog.id}`,
        journalItem: {} as DashboardTimelineEntry["journalItem"],
      },
    ];
  });
}

function toDashboardTimelineEntry(
  entry: ReflectionJourneyEntry,
  monthLabel: string,
): DashboardTimelineEntry {
  const dayOfMonth = Number(entry.date.split("-")[2]) || 0;

  return {
    ...entry,
    dayOfMonth,
    monthLabel,
  };
}

export function useDesktopDashboard() {
  const reflectionData = useReflectionData();
  const { allItems, allWorks } = useLibraryItems();
  const { entries: journalEntries } = useJournalEntries();

  const recentlyAdded = useMemo(() => {
    const sorted = sortLibraryItems(allItems, "recently-added");
    return sorted.slice(0, 6);
  }, [allItems]);

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

  const tasteTags = useMemo(
    () => calculateTasteTags(allItems, journalEntries, contentTagsByKey),
    [allItems, journalEntries, contentTagsByKey],
  );

  const journeyStats = useMemo(() => {
    const { books, movies, music } = reflectionData.mediaStats;
    const hasActivity = books + movies + music > 0;

    if (!hasActivity && allItems.length === 0) {
      return {
        monthLabel: reflectionData.monthYear,
        books: readingStats[0]?.value ?? 12,
        movies: readingStats[1]?.value ?? 8,
        listeningHours: readingStats[2]?.value ?? 24,
        moods: MOCK_MOODS,
      };
    }

    const moods = [
      ...reflectionData.moodTags.map((tag) => tag.label.toLowerCase()),
      ...tasteTags.map((tag) => tag.label.toLowerCase()),
    ]
      .filter(Boolean)
      .slice(0, 3);

    return {
      monthLabel: reflectionData.monthYear,
      books,
      movies,
      listeningHours: music > 0 ? Math.max(music * 3, 1) : 0,
      moods: moods.length > 0 ? moods : MOCK_MOODS,
    };
  }, [allItems.length, reflectionData, tasteTags]);

  const timelineEntries = useMemo(() => {
    if (reflectionData.journey.length > 0) {
      return reflectionData.journey.map((entry) =>
        toDashboardTimelineEntry(entry, reflectionData.month),
      );
    }

    return buildMockTimeline(reflectionData.month);
  }, [reflectionData.journey, reflectionData.month]);

  const reflectionSummary =
    reflectionData.reflection.summary &&
    reflectionData.reflection.summary !==
      "Your reflection will grow as you explore and journal more."
      ? reflectionData.reflection.summary
      : MOCK_REFLECTION_SUMMARY;

  const likedTitle =
    allItems.find((item) => item.status === "ONGOING" || item.status === "FINISHED")
      ?.title ??
    continueExploring[0]?.title ??
    "Norwegian Wood";

  const aiReflectionInput = useMemo(
    () => buildAiReflectionInput(allItems, journalEntries),
    [allItems, journalEntries],
  );

  return {
    journeyStats,
    timelineEntries,
    reflectionSummary,
    reflectionMonthYear: reflectionData.monthYear,
    picks: aiPicks.slice(0, 5),
    likedTitle,
    recentlyAdded,
    /** Canonical Work list for Home dashboard consumers. */
    works: allWorks,
    aiReflectionInput,
  };
}
