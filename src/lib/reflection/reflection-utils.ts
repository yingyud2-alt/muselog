import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { hasMuseActivity } from "@/lib/habit/habit-mock";
import { getLibraryLabels } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import type {
  ReflectionJourneyEntry,
  ReflectionMediaStats,
  ReflectionMoodTag,
  ReflectionTasteTag,
} from "@/lib/reflection/reflection-types";
import { resolveCanonicalCoverUrl } from "@/lib/work/resolve-canonical-work";
import type { HabitLog } from "@/types/habit";
import type { MediaItem } from "@/types/media";

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
  ],
  Curious: ["curious", "dreamlike", "surreal", "strange", "mystery", "wonder"],
  Romantic: ["romantic", "romance", "passion", "warm"],
};

const TASTE_DISPLAY_LABELS: Record<string, string> = {
  Quiet: "Quiet stories",
  Human: "Human relationships",
  Nostalgic: "Memory",
  Nature: "Nature",
  "Slow stories": "Slow stories",
  Curious: "Curious discoveries",
  Romantic: "Romantic warmth",
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  Reflective: ["reflective", "contemplative", "inward", "thoughtful", "meditative"],
  Curious: ["curious", "wonder", "discovery", "explore", "strange", "dreamlike"],
  Calm: ["calm", "quiet", "still", "peaceful", "gentle", "soft"],
  Nostalgic: ["nostalgic", "memory", "longing", "melancholy", "past"],
  Warm: ["warm", "tender", "love", "human", "intimate"],
};

export function formatReflectionMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatReflectionMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "Month";
}

function isInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split("-").map(Number);
  return y === year && m === month;
}

function entryDate(entry: MediaItem): string {
  return entry.endDate ?? entry.startDate ?? entry.date;
}

function itemActiveInMonth(item: LibraryItem, year: number, month: number): boolean {
  const candidates = [item.endDate, item.startDate, item.updatedAt.slice(0, 10)].filter(
    Boolean,
  ) as string[];

  return candidates.some((date) => isInMonth(date, year, month));
}

function filterMonthJournalEntries(
  journalEntries: MediaItem[],
  year: number,
  month: number,
): MediaItem[] {
  return journalEntries.filter((entry) => {
    const date = entryDate(entry);
    return date ? isInMonth(date, year, month) : false;
  });
}

function journeyStatusLabel(entry: MediaItem): string {
  if (entry.status === "READING") {
    if (entry.type === "book") return "Reading";
    if (entry.type === "movie") return "Watching";
    return "Listening";
  }
  if (entry.type === "book") return "Read";
  if (entry.type === "movie") return "Watched";
  return "Listened";
}

function formatJourneyDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  if (!month || !day) return date;
  return `${MONTH_NAMES[month - 1]?.slice(0, 3) ?? month} ${day}`;
}

export function calculateMonthlyStats(
  journalEntries: MediaItem[],
  habitLogs: HabitLog[],
  libraryItems: LibraryItem[],
  year: number,
  month: number,
): ReflectionMediaStats {
  const monthEntries = filterMonthJournalEntries(journalEntries, year, month);

  const booksFromJournal = monthEntries.filter((entry) => entry.type === "book").length;
  const moviesFromJournal = monthEntries.filter((entry) => entry.type === "movie").length;
  const musicFromJournal = monthEntries.filter((entry) => entry.type === "music").length;

  const monthLibrary = libraryItems.filter((item) =>
    itemActiveInMonth(item, year, month),
  );

  const books = Math.max(
    booksFromJournal,
    monthLibrary.filter((item) => item.type === "BOOK").length,
  );
  const movies = Math.max(
    moviesFromJournal,
    monthLibrary.filter((item) => item.type === "MOVIE").length,
  );
  const music = Math.max(
    musicFromJournal,
    monthLibrary.filter((item) => item.type === "MUSIC").length,
  );

  const journalDays = new Set(
    habitLogs
      .filter(
        (log) => isInMonth(log.date, year, month) && hasMuseActivity(log),
      )
      .map((log) => log.date),
  ).size;

  return { books, movies, music, journalDays };
}

function collectMonthTokens(
  monthEntries: MediaItem[],
  libraryItems: LibraryItem[],
  contentTagsByKey: Record<string, string[]>,
): string[] {
  const tokens: string[] = [];

  for (const entry of monthEntries) {
    tokens.push(...entry.tags);
    if (entry.note) tokens.push(entry.note);
    if (entry.quote) tokens.push(entry.quote);
  }

  for (const item of libraryItems) {
    tokens.push(...(contentTagsByKey[item.mediaKey] ?? []));
    if (item.shortReview) tokens.push(item.shortReview);
    if (item.notes) tokens.push(item.notes);
  }

  return tokens;
}

export function calculateReflectionTasteTags(
  monthEntries: MediaItem[],
  libraryItems: LibraryItem[],
  contentTagsByKey: Record<string, string[]>,
): ReflectionTasteTag[] {
  const tokens = collectMonthTokens(monthEntries, libraryItems, contentTagsByKey);
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
    .map(([label, weight]) => ({
      label: TASTE_DISPLAY_LABELS[label] ?? label,
      weight,
    }))
    .sort((left, right) => {
      if (right.weight !== left.weight) return right.weight - left.weight;
      return left.label.localeCompare(right.label);
    });

  const totalWeight = ranked.reduce((sum, tag) => sum + tag.weight, 0);
  if (totalWeight < 2) return [];

  return ranked.slice(0, 6);
}

export function calculateMoodSummary(
  monthEntries: MediaItem[],
  habitLogs: HabitLog[],
  year: number,
  month: number,
): ReflectionMoodTag[] {
  const tokens = collectMonthTokens(monthEntries, [], {});
  const monthLogs = habitLogs.filter((log) => isInMonth(log.date, year, month));

  if (monthLogs.some((log) => log.read)) tokens.push("reflective contemplative");
  if (monthLogs.some((log) => log.watch)) tokens.push("curious discovery");
  if (monthLogs.some((log) => log.listen)) tokens.push("calm gentle");

  const readDays = monthLogs.filter((log) => log.read).length;
  const watchDays = monthLogs.filter((log) => log.watch).length;
  const listenDays = monthLogs.filter((log) => log.listen).length;

  if (readDays >= watchDays && readDays >= listenDays && readDays > 0) {
    tokens.push("reflective inward thoughtful");
  }
  if (watchDays > 0 && listenDays > 0 && readDays > 0) {
    tokens.push("curious explore discovery");
  }

  const blob = tokens.join(" ").toLowerCase();
  const weights = new Map<string, number>();

  for (const [label, keywords] of Object.entries(MOOD_KEYWORDS)) {
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

  if (ranked.length === 0) return [];

  return ranked.slice(0, 4);
}

export function calculateMonthJourney(
  journalEntries: MediaItem[],
  year: number,
  month: number,
): ReflectionJourneyEntry[] {
  return filterMonthJournalEntries(journalEntries, year, month)
    .sort((left, right) => entryDate(left).localeCompare(entryDate(right)))
    .map((entry) => {
      const date = entryDate(entry);
      const typeKey =
        entry.type === "book" ? "BOOK" : entry.type === "movie" ? "MOVIE" : "MUSIC";

      const workId = entry.id.replace(/^journal-/, "");
      return {
        id: entry.id,
        title: entry.title,
        creator: entry.creator,
        cover: resolveCanonicalCoverUrl({
          workId,
          title: entry.title,
          creator: entry.creator,
          type: entry.type,
          journalCover: entry.cover,
        }),
        typeLabel: getLibraryLabels(typeKey).ongoingShort,
        statusLabel: journeyStatusLabel(entry),
        date,
        dateLabel: formatJourneyDate(date),
        journalItem: entry,
      };
    });
}

export function getMonthLibraryActivity(
  libraryItems: LibraryItem[],
  year: number,
  month: number,
): {
  completedWorks: LibraryItem[];
  ongoingWorks: LibraryItem[];
  activeItems: LibraryItem[];
} {
  const activeItems = libraryItems.filter((item) =>
    itemActiveInMonth(item, year, month),
  );

  const completedWorks = activeItems.filter((item) => item.status === "FINISHED");
  const ongoingWorks = libraryItems.filter((item) => item.status === "ONGOING");

  return { completedWorks, ongoingWorks, activeItems };
}

export function buildReflectionContentTagsMap(
  items: LibraryItem[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const item of items) {
    const content = getContentByMediaKey(item.mediaKey);
    map[item.mediaKey] = content?.tags ?? [];
  }

  return map;
}

export { filterMonthJournalEntries, entryDate };
