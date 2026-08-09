"use client";

import { useEffect, useMemo } from "react";

import type { AiPickItem } from "@/components/dashboard/mock-data";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getUserContentById } from "@/lib/content/user-content-store";
import { buildAiReflectionInput } from "@/lib/ai/build-ai-reflection-input";
import { sortLibraryItems } from "@/lib/library/library-items";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  buildContentTagsMap,
  calculateTasteTags,
} from "@/lib/profile/profile-utils";
import { useReflectionData } from "@/lib/reflection/use-reflection-data";
import type { ReflectionJourneyEntry } from "@/lib/reflection/reflection-types";
import {
  filterDisplayableApiWorks,
  isDisplayableApiWork,
  isDisplayableJournalEntry,
} from "@/lib/work/displayable-api-work";
import {
  logCanonicalWorkVerification,
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import type { Work } from "@/types/work";

export type DashboardTimelineEntry = ReflectionJourneyEntry & {
  dayOfMonth: number;
  monthLabel: string;
  exploreHref?: string;
};

function workToAiPick(work: Work): AiPickItem {
  const categoryLabel =
    work.type === "movie" ? "Movie" : work.type === "music" ? "Music" : "Book";
  const genres = work.genres.slice(0, 2).join(" / ");
  return {
    type: work.type,
    categoryLabel,
    title: work.title,
    creator: work.creator,
    reason: genres
      ? `From the public catalog · ${genres}`
      : "From your Open Library / TMDB / Last.fm catalog",
  };
}

function toDashboardTimelineEntry(
  entry: ReflectionJourneyEntry,
  monthLabel: string,
): DashboardTimelineEntry | null {
  const dayOfMonth = Number(entry.date.split("-")[2]) || 0;
  const workId =
    entry.journalItem?.id?.replace(/^journal-/, "") || entry.id;
  const canonical = resolveCanonicalWork({
    workId,
    title: entry.title,
    creator: entry.creator,
    type: entry.journalItem?.type,
  });

  if (!canonical || !isDisplayableApiWork(canonical)) {
    if (entry.journalItem && !isDisplayableJournalEntry(entry.journalItem)) {
      return null;
    }
    if (!canonical || !isDisplayableApiWork(canonical)) return null;
  }

  const cover = resolveCanonicalCoverUrl({
    workId: canonical.id,
    title: entry.title,
    creator: entry.creator,
    type: entry.journalItem?.type,
    journalCover: entry.cover,
  });

  return {
    ...entry,
    id: canonical.id,
    cover,
    dayOfMonth,
    monthLabel,
    exploreHref: `/explore/${canonical.id}`,
  };
}

export function useDesktopDashboard() {
  const reflectionData = useReflectionData();
  const { allItems, allWorks } = useLibraryItems();
  const { entries: journalEntries } = useJournalEntries();
  const importedMap = useImportedWorkMap();

  const displayableWorks = useMemo(
    () => filterDisplayableApiWorks(Object.values(importedMap)),
    [importedMap],
  );

  const libraryWorks = useMemo(
    () => filterDisplayableApiWorks(allWorks),
    [allWorks],
  );

  const recentlyAdded = useMemo(() => {
    const sorted = sortLibraryItems(allItems, "recently-added").filter(
      (item) => {
        const canonical = resolveCanonicalWork({
          workId: item.mediaKey,
          title: item.title,
          creator: item.creator,
          type: item.type,
        });
        return Boolean(canonical && isDisplayableApiWork(canonical));
      },
    );
    return sorted.slice(0, 6);
  }, [allItems, importedMap]);

  useEffect(() => {
    logCanonicalWorkVerification(
      "home",
      [
        ...recentlyAdded.map((item) => ({
          storedWorkId: item.mediaKey,
          title: item.title,
          creator: item.creator,
          type: item.type,
        })),
        ...libraryWorks.map((work) => ({
          storedWorkId: work.id,
          title: work.title,
          creator: work.creator,
          type: work.type,
        })),
      ],
    );
  }, [recentlyAdded, libraryWorks, importedMap]);

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
      moods,
    };
  }, [reflectionData, tasteTags]);

  const timelineEntries = useMemo(() => {
    return reflectionData.journey
      .map((entry) =>
        toDashboardTimelineEntry(entry, reflectionData.month),
      )
      .filter((entry): entry is DashboardTimelineEntry => entry !== null);
  }, [reflectionData.journey, reflectionData.month, importedMap]);

  const reflectionSummary =
    reflectionData.reflection.summary &&
    reflectionData.reflection.summary !==
      "Your reflection will grow as you explore and journal more."
      ? reflectionData.reflection.summary
      : "Your reflection will grow as you explore and journal more.";

  const likedTitle =
    recentlyAdded.find(
      (item) => item.status === "ONGOING" || item.status === "FINISHED",
    )?.title ??
    displayableWorks.find((work) => work.type === "book")?.title ??
    "Norwegian Wood";

  const picks = useMemo(() => {
    const pool =
      displayableWorks.length > 0 ? displayableWorks : libraryWorks;
    return pool.slice(0, 5).map(workToAiPick);
  }, [displayableWorks, libraryWorks]);

  const aiReflectionInput = useMemo(
    () => buildAiReflectionInput(allItems, journalEntries),
    [allItems, journalEntries],
  );

  return {
    journeyStats,
    timelineEntries,
    reflectionSummary,
    reflectionMonthYear: reflectionData.monthYear,
    picks,
    likedTitle,
    recentlyAdded,
    /** Canonical displayable Work list for Home dashboard consumers. */
    works: libraryWorks.length > 0 ? libraryWorks : displayableWorks,
    aiReflectionInput,
  };
}
