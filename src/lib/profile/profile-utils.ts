import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { computeMuseStreak, getDisplayTodayString } from "@/lib/habit/habit-utils";
import { hasMuseActivity } from "@/lib/habit/habit-mock";
import { getLibraryLabels, getLibraryStatusLabel } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import type { ImportBatch } from "@/lib/import/import-types";
import type {
  CurrentJourneyItem,
  MemoryHighlight,
  MonthlyReflection,
  MusePersona,
  ProfileFavorite,
  ProfileIdentity,
  ProfileStats,
  ProfileTimelineEntry,
  ProfileTimelineYear,
  TasteTag,
  TasteTimelineMoment,
} from "@/types/profile";
import type { HabitLog } from "@/types/habit";
import type { MediaItem } from "@/types/media";

export const PROFILE_DISPLAY_NAME = "Sam";

const TASTE_KEYWORDS: Record<string, string[]> = {
  "Quiet Stories": [
    "quiet",
    "calm",
    "still",
    "gentle",
    "soft",
    "silent",
    "peaceful",
  ],
  "Human Connection": [
    "human",
    "intimate",
    "warm",
    "tender",
    "love",
    "relationship",
    "heart",
    "connection",
  ],
  "Nostalgic Sounds": [
    "nostalgic",
    "melancholy",
    "longing",
    "memory",
    "past",
    "bittersweet",
  ],
  "Slow Living": [
    "slow",
    "reflective",
    "contemplative",
    "routine",
    "meditative",
    "quiet",
    "still",
  ],
  Curiosity: ["curious", "dreamlike", "surreal", "strange", "mystery", "wonder"],
  Romance: ["romantic", "romance", "passion", "warm"],
  Nature: ["nature", "forest", "ocean", "landscape", "earth", "green", "wind"],
};

const MOCK_DNA_TAGS: TasteTag[] = [
  { label: "Quiet Stories", weight: 5 },
  { label: "Human Connection", weight: 4 },
  { label: "Slow Living", weight: 3 },
  { label: "Nostalgic Sounds", weight: 3 },
];

const MOCK_PERSONA: MusePersona = {
  title: "The Quiet Observer",
  description:
    "You are drawn to quiet stories, human relationships, and nostalgic sounds.",
  confidence: 68,
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
  if (tokens.length === 0) return MOCK_DNA_TAGS;

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
  if (totalWeight < 2) return MOCK_DNA_TAGS;

  return ranked.slice(0, 5);
}

export function calculateCulturalDna(
  items: LibraryItem[],
  journalEntries: MediaItem[],
  contentTagsByKey: Record<string, string[]>,
): TasteTag[] {
  return calculateTasteTags(items, journalEntries, contentTagsByKey).slice(0, 5);
}

export function calculateMusePersona(tags: TasteTag[]): MusePersona {
  if (tags.length === 0) return { ...MOCK_PERSONA, confidence: 62 };

  const labels = tags.map((tag) => tag.label);
  const primary = labels[0] ?? "Quiet Stories";
  const secondary = labels[1] ?? "Human Connection";
  const tertiary = labels[2] ?? "Nostalgic Sounds";
  const totalWeight = tags.reduce((sum, tag) => sum + tag.weight, 0);

  let title = "The Quiet Observer";
  if (primary.includes("Quiet") || primary.includes("Slow")) {
    title = "The Quiet Observer";
  } else if (primary.includes("Curious")) {
    title = "The Curious Wanderer";
  } else if (primary.includes("Nostalgic")) {
    title = "The Memory Keeper";
  } else if (primary.includes("Human") || primary.includes("Romance")) {
    title = "The Intimate Observer";
  } else if (primary.includes("Nature")) {
    title = "The Soft Landscape Listener";
  } else {
    title = "The Reflective Explorer";
  }

  const confidence = Math.min(
    94,
    Math.max(58, 54 + totalWeight * 4 + tags.length * 3),
  );

  return {
    title,
    description: `You are drawn to ${primary.toLowerCase()}, ${secondary.toLowerCase()}, and ${tertiary.toLowerCase()}.`,
    confidence,
  };
}

export function calculateMemoryHighlights(
  journalEntries: MediaItem[],
  limit = 4,
): MemoryHighlight[] {
  const candidates = journalEntries
    .filter((entry) => Boolean(entry.note?.trim() || entry.quote?.trim()))
    .sort((left, right) =>
      entryDate(right).localeCompare(entryDate(left)),
    );

  const highlights = candidates.slice(0, limit).map((entry) => ({
    id: entry.id,
    title: entry.title,
    creator: entry.creator,
    date: entryDate(entry),
    excerpt:
      entry.note?.trim() ||
      entry.quote?.trim() ||
      "A quiet memory kept in your journal.",
    journalItem: entry,
  }));

  if (highlights.length > 0) return highlights;

  return [
    {
      id: "mock-memory-1",
      title: "Norwegian Wood",
      creator: "Haruki Murakami",
      date: "2026-07-12",
      excerpt: "A quiet journey about loneliness and connection.",
      journalItem: {
        id: "mock-memory-1",
        type: "book",
        title: "Norwegian Wood",
        creator: "Haruki Murakami",
        cover: "from-emerald-900 via-teal-950 to-slate-950",
        date: "2026-07-12",
        startDate: "2026-07-01",
        endDate: "2026-07-12",
        status: "FINISHED",
        note: "A quiet journey about loneliness and connection.",
        quote: "",
        rating: 5,
        tags: ["quiet", "memory"],
      },
    },
  ];
}

export function calculateTasteTimelineMoments(
  timeline: ProfileTimelineYear[],
): TasteTimelineMoment[] {
  const moments: TasteTimelineMoment[] = [];

  for (const yearGroup of timeline) {
    for (const monthGroup of yearGroup.months) {
      const books = monthGroup.entries.filter(
        (entry) => entry.journalItem.type === "book",
      ).length;
      const movies = monthGroup.entries.filter(
        (entry) => entry.journalItem.type === "movie",
      ).length;
      const music = monthGroup.entries.filter(
        (entry) => entry.journalItem.type === "music",
      ).length;

      let insight = "A quiet stretch of cultural moments";
      const dominant = Math.max(books, movies, music);

      if (dominant === 0) {
        insight = "Saved something for later";
      } else if (books === dominant) {
        insight = books > 1 ? "Books deepened this month" : "A book shaped the month";
      } else if (movies === dominant) {
        insight =
          movies > 1 ? "Films left a stronger mark" : "A film changed the mood";
      } else {
        insight =
          music > 1 ? "Music mood shifted" : "A soundtrack found you";
      }

      moments.push({
        id: `${yearGroup.year}-${monthGroup.month}`,
        year: yearGroup.year,
        month: monthGroup.month,
        insight,
        entryCount: monthGroup.entries.length,
      });
    }
  }

  if (moments.length > 0) return moments.slice(0, 8);

  return [
    {
      id: "mock-2026-july",
      year: "2026",
      month: "July",
      insight: "Books deepened · Music mood shifted",
      entryCount: 3,
    },
  ];
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
