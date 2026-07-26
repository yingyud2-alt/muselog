"use client";

import { useCallback, useMemo, useState } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
import { DISPLAY_REFERENCE_DATE } from "@/lib/display-date";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  buildTasteRankings,
  formatMuseMonthShort,
  resolveMuseProfileData,
  shiftMuseMonth,
  type MuseProfileData,
  type MuseRankingCandidate,
} from "@/lib/profile/muse-profile-data";
import { useProfileData } from "@/lib/profile/use-profile-data";
import type { ContentType } from "@/lib/content/types";

function entryDate(entry: {
  date: string;
  startDate?: string;
  endDate?: string;
}): string {
  return entry.endDate ?? entry.startDate ?? entry.date;
}

function toContentType(type: string): ContentType | null {
  const upper = type.toUpperCase();
  if (upper === "BOOK" || upper === "MOVIE" || upper === "MUSIC") return upper;
  if (type === "book") return "BOOK";
  if (type === "movie") return "MOVIE";
  if (type === "music") return "MUSIC";
  return null;
}

export function useMuseProfile() {
  const referenceYear = DISPLAY_REFERENCE_DATE.getUTCFullYear();
  const referenceMonth = DISPLAY_REFERENCE_DATE.getUTCMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(referenceYear);
  const [selectedMonth, setSelectedMonth] = useState(referenceMonth);

  const { musePersona, culturalDna, stats, works } = useProfileData();
  const { entries: journalEntries } = useJournalEntries();
  const { allItems } = useLibraryItems();

  const profile: MuseProfileData = useMemo(() => {
    const monthEntries = journalEntries.filter((entry) => {
      const date = entryDate(entry);
      const [y, m] = date.split("-").map(Number);
      return y === selectedYear && m === selectedMonth;
    });

    const books = monthEntries.filter((e) => e.type === "book").length;
    const movies = monthEntries.filter((e) => e.type === "movie").length;
    const musicEntries = monthEntries.filter((e) => e.type === "music");
    const musicHours = Math.max(
      1,
      Math.round(
        musicEntries.reduce((sum, entry) => sum + (entry.duration ?? 45), 0) /
          60,
      ),
    );
    const hasLiveMonth = books + movies + musicEntries.length > 0;

    const yearEntries = journalEntries.filter((entry) =>
      entryDate(entry).startsWith(String(selectedYear)),
    );

    const keywords =
      culturalDna.length > 0
        ? culturalDna.map((tag) => ({
            label: tag.label
              .replace("Quiet Stories", "Quiet Moments")
              .replace("Nostalgic Sounds", "Nostalgic")
              .replace("Slow Living", "Slow Cinema"),
            weight: tag.weight,
          }))
        : undefined;

    const hasLiveStores = journalEntries.length > 0 || allItems.length > 0;

    const titleCounts = new Map<string, number>();
    for (const entry of journalEntries) {
      const key = entry.title.toLowerCase();
      titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
    }

    const candidates: MuseRankingCandidate[] = [];

    for (const item of allItems) {
      const type = toContentType(item.type);
      if (!type) continue;
      candidates.push({
        id: item.mediaKey,
        title: item.title,
        creator: item.creator,
        type,
        cover: item.cover,
        rating: item.rating,
        note: item.shortReview ?? item.notes,
        status: item.status,
        tags: culturalDna.map((tag) => tag.label),
        revisited: (titleCounts.get(item.title.toLowerCase()) ?? 0) > 1,
      });
    }

    for (const entry of journalEntries) {
      const type = toContentType(entry.type);
      if (!type) continue;
      if (candidates.some((c) => c.title.toLowerCase() === entry.title.toLowerCase())) {
        continue;
      }
      candidates.push({
        id: entry.id,
        title: entry.title,
        creator: entry.creator,
        type,
        cover: entry.cover,
        rating: entry.rating,
        note: entry.note,
        status: entry.status,
        tags: entry.tags,
        revisited: (titleCounts.get(entry.title.toLowerCase()) ?? 0) > 1,
      });
    }

    const tasteRankings = buildTasteRankings(candidates);

    return resolveMuseProfileData(selectedYear, selectedMonth, {
      persona: {
        personaName: musePersona.title || undefined,
        description: musePersona.description || undefined,
        confidence: musePersona.confidence,
      },
      keywords,
      journey: hasLiveMonth
        ? { books, movies, musicHours }
        : undefined,
      yearStats: hasLiveStores
        ? {
            totalMemories: Math.max(yearEntries.length, stats.total, 1),
            books: stats.books || undefined,
            movies: stats.movies || undefined,
            music: stats.music || undefined,
          }
        : undefined,
      tasteRankings,
      source: hasLiveStores ? "derived" : "mock",
    });
  }, [
    selectedYear,
    selectedMonth,
    journalEntries,
    allItems,
    musePersona,
    culturalDna,
    stats,
  ]);

  const goPrevMonth = () => {
    const next = shiftMuseMonth(selectedYear, selectedMonth, -1);
    setSelectedYear(next.year);
    setSelectedMonth(next.month);
  };

  const goNextMonth = () => {
    const next = shiftMuseMonth(selectedYear, selectedMonth, 1);
    setSelectedYear(next.year);
    setSelectedMonth(next.month);
  };

  const adjacent = useMemo(() => {
    const prev = shiftMuseMonth(selectedYear, selectedMonth, -1);
    const next = shiftMuseMonth(selectedYear, selectedMonth, 1);
    return {
      prevLabel: formatMuseMonthShort(prev.year, prev.month),
      nextLabel: formatMuseMonthShort(next.year, next.month),
      currentLabel: profile.monthlyReflection.label,
    };
  }, [selectedYear, selectedMonth, profile.monthlyReflection.label]);

  const setMonth = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  return {
    profile,
    /** Canonical Work list for Profile consumers. */
    works,
    goPrevMonth,
    goNextMonth,
    setMonth,
    adjacent,
  };
}
