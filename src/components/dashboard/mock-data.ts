import {
  BookOpen,
  Film,
  Headphones,
  type LucideIcon,
} from "lucide-react";

import { DISPLAY_REFERENCE_DATE } from "@/lib/display-date";

export type MediaType = "book" | "movie" | "music";

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type MediaProgressItem = {
  title: string;
  creator: string;
  type: MediaType;
  categoryLabel: "Reading" | "Watching" | "Listening";
  progress: number;
  coverClassName: string;
  lastOpened: string;
};

export type RecentlyAddedItem = {
  title: string;
  subtitle: string;
  type: Exclude<MediaType, "music">;
  coverClassName: string;
  addedAt: string;
};

export type StatItem = {
  label: string;
  value: number;
  icon: LucideIcon;
  description: string;
};

export type ActivityDay = {
  date: string;
  level: ActivityLevel;
  count: number;
};

export type ActivityWeek = {
  weekStart: string;
  days: ActivityDay[];
};

export type AiPickItem = {
  type: MediaType;
  categoryLabel: "Book" | "Movie" | "Music";
  title: string;
  creator: string;
  reason: string;
};

/** @deprecated Use MediaProgressItem — kept for gradual migration */
export type ContinueReadingItem = MediaProgressItem;

export const continueExploring: MediaProgressItem[] = [
  {
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    type: "book",
    categoryLabel: "Reading",
    progress: 68,
    lastOpened: "2 days ago",
    coverClassName: "from-neutral-600 via-neutral-700 to-neutral-900",
  },
  {
    title: "In the Mood for Love",
    creator: "Wong Kar-wai",
    type: "movie",
    categoryLabel: "Watching",
    progress: 45,
    lastOpened: "Yesterday",
    coverClassName: "from-neutral-500 via-neutral-700 to-neutral-800",
  },
  {
    title: "Blonde",
    creator: "Frank Ocean",
    type: "music",
    categoryLabel: "Listening",
    progress: 82,
    lastOpened: "Today",
    coverClassName: "from-neutral-400 via-neutral-600 to-neutral-800",
  },
];

export const recentlyAdded: RecentlyAddedItem[] = [
  {
    title: "Interstellar",
    subtitle: "Christopher Nolan",
    type: "movie",
    addedAt: "Today",
    coverClassName: "from-neutral-700 via-neutral-800 to-neutral-950",
  },
  {
    title: "Merry Christmas Mr. Lawrence",
    subtitle: "Nagisa Oshima",
    type: "movie",
    addedAt: "3 days ago",
    coverClassName: "from-neutral-600 via-neutral-700 to-neutral-900",
  },
];

export const readingStats: StatItem[] = [
  {
    label: "books",
    value: 12,
    icon: BookOpen,
    description: "Finished this year",
  },
  {
    label: "movies",
    value: 8,
    icon: Film,
    description: "Logged in your journal",
  },
  {
    label: "hours listening",
    value: 24,
    icon: Headphones,
    description: "Music & podcasts",
  },
];

export const aiPicks: AiPickItem[] = [
  {
    type: "book",
    categoryLabel: "Book",
    title: "Kafka on the Shore",
    creator: "Haruki Murakami",
    reason:
      "Surreal and introspective — a natural follow-up to your Murakami reading streak.",
  },
  {
    type: "movie",
    categoryLabel: "Movie",
    title: "Perfect Days",
    creator: "Wim Wenders",
    reason:
      "Quiet, observational cinema that pairs well with your taste in Wong Kar-wai.",
  },
  {
    type: "music",
    categoryLabel: "Music",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    reason:
      "Intimate and reflective — complements the mood of your current listening.",
  },
];

const ACTIVITY_WEEKS = 16;

function hashDate(dateStr: string): number {
  let hash = 0;

  for (let index = 0; index < dateStr.length; index += 1) {
    hash = (hash + dateStr.charCodeAt(index) * (index + 1)) % 997;
  }

  return hash;
}

function levelFromDate(dateStr: string): ActivityLevel {
  const distribution: ActivityLevel[] = [0, 0, 0, 1, 1, 2, 2, 3, 4];
  return distribution[hashDate(dateStr) % distribution.length];
}

function countFromLevel(level: ActivityLevel, dateStr: string): number {
  if (level === 0) {
    return 0;
  }

  return level * 2 + (hashDate(dateStr) % 2);
}

function formatDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfWeekUTC(date: Date): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCDate(result.getUTCDate() - result.getUTCDay());

  return result;
}

export function generateActivityWeeks(
  weekCount = ACTIVITY_WEEKS,
  referenceDate: Date = DISPLAY_REFERENCE_DATE,
): ActivityWeek[] {
  const today = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );

  const currentWeekStart = startOfWeekUTC(today);
  const weeks: ActivityWeek[] = [];

  for (let weekOffset = weekCount - 1; weekOffset >= 0; weekOffset -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - weekOffset * 7);

    const days: ActivityDay[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + dayOffset);

      const dateStr = formatDateISO(date);
      const isFuture = date > today;
      const level: ActivityLevel = isFuture ? 0 : levelFromDate(dateStr);
      const count = isFuture ? 0 : countFromLevel(level, dateStr);

      days.push({ date: dateStr, level, count });
    }

    weeks.push({
      weekStart: formatDateISO(weekStart),
      days,
    });
  }

  return weeks;
}

export const activityWeeks = generateActivityWeeks(ACTIVITY_WEEKS);
