import { DISPLAY_DATE_LOCALE } from "@/lib/display-date";
import { MONTH_MOOD_TAGLINES } from "@/lib/calendar/constants";
import type { MediaItem, MediaType } from "@/types/media";

export type MonthSummary = {
  total: number;
  books: number;
  movies: number;
  albums: number;
};

export function computeMonthSummary(items: MediaItem[]): MonthSummary {
  return {
    total: items.length,
    books: items.filter((item) => item.type === "book").length,
    movies: items.filter((item) => item.type === "movie").length,
    albums: items.filter((item) => item.type === "music").length,
  };
}

export function formatSummaryTypeLabel(type: MediaType, count: number): string {
  if (count === 0) {
    return "";
  }

  const labels: Record<MediaType, [string, string]> = {
    book: ["book", "books"],
    movie: ["movie", "movies"],
    music: ["album", "albums"],
  };

  const [singular, plural] = labels[type];

  return `${count} ${count === 1 ? singular : plural}`;
}

export type CalendarDayCell = {
  date: string | null;
  day: number | null;
  isCurrentMonth: boolean;
};

export type CalendarWeek = {
  days: CalendarDayCell[];
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatTimelineDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatCardDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function buildMonthGrid(year: number, month: number): CalendarWeek[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = (firstDay.getUTCDay() + 6) % 7;

  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ date: null, day: null, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    cells.push({
      date: `${year}-${monthStr}-${dayStr}`,
      day,
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null, isCurrentMonth: false });
  }

  const weeks: CalendarWeek[] = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push({ days: cells.slice(index, index + 7) });
  }

  return weeks;
}

export function groupMediaByDate<T extends { date: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const existing = map.get(item.date) ?? [];
    existing.push(item);
    map.set(item.date, existing);
  }

  return map;
}

export function sortMediaByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

function hashDateString(dateStr: string): number {
  let hash = 0;

  for (let index = 0; index < dateStr.length; index += 1) {
    hash = (hash + dateStr.charCodeAt(index) * (index + 1)) % 997;
  }

  return hash;
}

export type EmptyDayDecoration = {
  tintClass: string;
  dotCount: number;
  moonOpacity: number;
};

const EMPTY_DAY_TINTS = [
  "from-teal-500/[0.03] to-transparent",
  "from-slate-400/[0.025] to-transparent",
  "from-emerald-500/[0.03] to-transparent",
  "from-cyan-500/[0.025] to-transparent",
] as const;

export function getEmptyDayDecoration(dateStr: string): EmptyDayDecoration {
  const hash = hashDateString(dateStr);

  return {
    tintClass: EMPTY_DAY_TINTS[hash % EMPTY_DAY_TINTS.length],
    dotCount: 1 + (hash % 3),
    moonOpacity: 0.12 + (hash % 4) * 0.04,
  };
}

export type MonthReflection = {
  tagline: string;
  mostMemorable: MediaItem | null;
};

export function getMonthReflection(items: MediaItem[]): MonthReflection {
  if (items.length === 0) {
    return { tagline: "A quiet month", mostMemorable: null };
  }

  const tagCounts = new Map<string, number>();

  for (const item of items) {
    for (const tag of item.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const dominantTag = [...tagCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0];

  const tagline =
    (dominantTag && MONTH_MOOD_TAGLINES[dominantTag]) ||
    "A month of quiet stories";

  const mostMemorable = [...items].sort((left, right) => {
    if (right.rating !== left.rating) {
      return right.rating - left.rating;
    }

    return (left.date ?? "").localeCompare(right.date ?? "");
  })[0];

  return { tagline, mostMemorable };
}
