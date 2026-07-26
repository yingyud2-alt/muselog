import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { computeMuseStreak, getDisplayTodayString } from "@/lib/habit/habit-utils";
import { hasMuseActivity } from "@/lib/habit/habit-mock";
import { getLibraryLabels, getLibraryStatusLabel } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import type { ImportBatch } from "@/lib/import/import-types";
import type {
  CurrentJourneyItem,
  MonthlyReflection,
  ProfileFavorite,
  ProfileIdentity,
  ProfileStats,
  ProfileTimelineEntry,
  ProfileTimelineYear,
  TasteTag,
} from "@/types/profile";
import type { HabitLog } from "@/types/habit";
import type { MediaItem } from "@/types/media";

export const PROFILE_DISPLAY_NAME = "Sam";

const TASTE_KEYWORDS: Record<string, string[]> = {
  Quiet: ["quiet", "calm", "still", "gentle", "soft", "silent", "peaceful"],
  Human: ["human", "intimate", "warm", "tender", "love", "relationship", "heart"],
  Nostalgic: ["nostalgic", "melancholy", "longing", "memory", "past", "bittersweet"],
  Nature: ["nature", "forest", "ocean", "landscape", "earth", "green", "wind"],
  "Slow stories": [
    "slow",
    "reflective",
    "contemplative",
    "routine",
    "meditative",
    "quiet",
    "still",
  ],
  Curious: ["curious", "dreamlike", "surreal", "strange", "mystery", "wonder"],
  Romantic: ["romantic", "romance", "passion", "warm"],
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split("-").map(Number);
  return y === year && m === month;
}

function formatMemberSince(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return "Since July 2026";
  return `Since ${MONTH_NAMES[month - 1]} ${year}`;
}

function entryDate(entry: MediaItem): string {
  return entry.endDate ?? entry.startDate ?? entry.date;
}

function mediaTypeLabel(type: MediaItem["type"]): string {
  if (type === "book") return "Reading";
  if (type === "movie") return "Watched";
  return "Listened";
}

function timelineStatusLabel(entry: MediaItem): string {
  if (entry.status === "READING") return mediaTypeLabel(entry.type);
  if (entry.status === "FINISHED") {
    if (entry.type === "book") return "Read";
    if (entry.type === "movie") return "Watched";
    return "Listened";
  }
  return "Saved";
}

export function calculateMediaStats(items: LibraryItem[]): ProfileStats {
  return {
    total: items.length,
    books: items.filter((item) => item.type === "BOOK").length,
    movies: items.filter((item) => item.type === "MOVIE").length,
    music: items.filter((item) => item.type === "MUSIC").length,
    finished: items.filter((item) => item.status === "FINISHED").length,
    ongoing: items.filter((item) => item.status === "ONGOING").length,
  };
}

export function calculateIdentity(
  items: LibraryItem[],
  importBatches: ImportBatch[],
): ProfileIdentity {
  const dates = items.map((item) => item.createdAt).filter(Boolean);

  for (const batch of importBatches) {
    dates.push(batch.importedAt);
  }

  dates.sort();
  const earliest = dates[0]?.slice(0, 10) ?? "2026-07-01";

  return {
    displayName: PROFILE_DISPLAY_NAME,
    totalMemories: items.length,
    memberSince: formatMemberSince(earliest),
  };
}

export function calculateCurrentJourney(
  items: LibraryItem[],
): CurrentJourneyItem | null {
  const ongoing = items
    .filter((item) => item.status === "ONGOING")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return ongoing[0] ?? null;
}

export function calculateMonthlyReflection(
  journalEntries: MediaItem[],
  habitLogs: HabitLog[],
  year: number,
  month: number,
): MonthlyReflection {
  const monthEntries = journalEntries.filter((entry) => {
    const date = entryDate(entry);
    return date ? isInMonth(date, year, month) : false;
  });

  const books = monthEntries.filter((entry) => entry.type === "book").length;
  const movies = monthEntries.filter((entry) => entry.type === "movie").length;
  const music = monthEntries.filter((entry) => entry.type === "music").length;

  const journalDays = new Set(
    habitLogs
      .filter(
        (log) => isInMonth(log.date, year, month) && hasMuseActivity(log),
      )
      .map((log) => log.date),
  ).size;

  const streak = computeMuseStreak(habitLogs, getDisplayTodayString());

  return {
    month: MONTH_NAMES[month - 1],
    books,
    movies,
    music,
    journalDays,
    streak,
  };
}

function collectTasteTokens(
  items: LibraryItem[],
  journalEntries: MediaItem[],
  contentTagsByKey: Record<string, string[]>,
): string[] {
  const tokens: string[] = [];

  for (const item of items) {
    const catalogTags = contentTagsByKey[item.mediaKey] ?? [];
    tokens.push(...catalogTags);

    if (item.shortReview) tokens.push(item.shortReview);
    if (item.notes) tokens.push(item.notes);
  }

  for (const entry of journalEntries) {
    tokens.push(...entry.tags);
    if (entry.note) tokens.push(entry.note);
    if (entry.quote) tokens.push(entry.quote);
  }

  return tokens;
}

export function calculateTasteTags(
  items: LibraryItem[],
  journalEntries: MediaItem[],
  contentTagsByKey: Record<string, string[]>,
): TasteTag[] {
  const tokens = collectTasteTokens(items, journalEntries, contentTagsByKey);
  if (tokens.length === 0) return [];

  const blob = tokens.join(" ").toLowerCase();
  const weights = new Map<string, number>();

  for (const [label, keywords] of Object.entries(TASTE_KEYWORDS)) {
    let weight = 0;
    for (const keyword of keywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = blob.match(pattern);
      if (matches) weight += matches.length;
    }
    if (weight > 0) weights.set(label, weight);
  }

  const ranked = [...weights.entries()]
    .map(([label, weight]) => ({ label, weight }))
    .sort((left, right) => {
      if (right.weight !== left.weight) return right.weight - left.weight;
      return left.label.localeCompare(right.label);
    });

  const totalWeight = ranked.reduce((sum, tag) => sum + tag.weight, 0);
  if (totalWeight < 2) return [];

  return ranked.slice(0, 5);
}

export function calculateFavorites(items: LibraryItem[]): ProfileFavorite[] {
  return items
    .filter((item) => typeof item.rating === "number" && item.rating > 0)
    .sort((left, right) => {
      const ratingDiff = (right.rating ?? 0) - (left.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, 5);
}

export function calculateTimeline(
  journalEntries: MediaItem[],
): ProfileTimelineYear[] {
  const sorted = [...journalEntries].sort((left, right) =>
    entryDate(right).localeCompare(entryDate(left)),
  );

  const yearMap = new Map<string, Map<string, ProfileTimelineEntry[]>>();

  for (const entry of sorted) {
    const date = entryDate(entry);
    if (!date) continue;

    const [year, month] = date.split("-");
    const monthLabel = MONTH_NAMES[Number(month) - 1] ?? month;

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;

    if (!monthMap.has(monthLabel)) monthMap.set(monthLabel, []);

    monthMap.get(monthLabel)!.push({
      id: entry.id,
      title: entry.title,
      creator: entry.creator,
      typeLabel: getLibraryLabels(
        entry.type === "book" ? "BOOK" : entry.type === "movie" ? "MOVIE" : "MUSIC",
      ).ongoing,
      statusLabel: timelineStatusLabel(entry),
      date,
      journalItem: entry,
    });
  }

  return [...yearMap.entries()]
    .sort(([leftYear], [rightYear]) => rightYear.localeCompare(leftYear))
    .map(([year, monthMap]) => ({
      year,
      months: [...monthMap.entries()].map(([month, entries]) => ({
        month,
        entries,
      })),
    }));
}

export function buildContentTagsMap(items: LibraryItem[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const item of items) {
    const content = getContentByMediaKey(item.mediaKey);
    map[item.mediaKey] = content?.tags ?? [];
  }

  return map;
}

export function formatProfileDate(date?: string): string {
  if (!date) return "—";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${MONTH_NAMES[month - 1]?.slice(0, 3) ?? month} ${day}`;
}

export function getJourneyStatusLabel(item: LibraryItem): string {
  return getLibraryStatusLabel(item.type, item.status, item.progress);
}
