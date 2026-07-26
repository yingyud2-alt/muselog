import type { MediaItem, MediaType } from "@/types/media";

export type MonthlyTypeCounts = {
  book: number;
  movie: number;
  music: number;
};

export type CulturalRhythmPoint = {
  day: number;
  date: string;
  count: number;
};

const TYPE_KEYS: MediaType[] = ["book", "movie", "music"];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function filterMediaForMonth(
  items: MediaItem[],
  year: number,
  month: number,
): MediaItem[] {
  const prefix = `${year}-${pad2(month)}`;

  return items.filter((item) => {
    const start = item.startDate ?? item.date;
    const end = item.endDate ?? start;
    if (!start) return false;

    const monthStart = `${prefix}-01`;
    const monthEnd = `${prefix}-${pad2(daysInMonth(year, month))}`;

    return start <= monthEnd && end >= monthStart;
  });
}

/** Count works by media type for the month (personal archive bars). */
export function computeMonthlyTypeCounts(
  items: MediaItem[],
  year: number,
  month: number,
): MonthlyTypeCounts {
  const monthItems = filterMediaForMonth(items, year, month);
  const counts: MonthlyTypeCounts = { book: 0, movie: 0, music: 0 };

  for (const item of monthItems) {
    if (TYPE_KEYS.includes(item.type)) {
      counts[item.type] += 1;
    }
  }

  return counts;
}

function dateOverlapsDay(
  item: MediaItem,
  dayDate: string,
): boolean {
  const start = item.startDate ?? item.date;
  const end = item.endDate ?? start;
  if (!start) return false;
  return dayDate >= start && dayDate <= end;
}

/** Daily activity counts across the month (works active that day). */
export function computeCulturalRhythm(
  items: MediaItem[],
  year: number,
  month: number,
): CulturalRhythmPoint[] {
  const totalDays = daysInMonth(year, month);
  const monthItems = filterMediaForMonth(items, year, month);
  const points: CulturalRhythmPoint[] = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    const count = monthItems.filter((item) => dateOverlapsDay(item, date)).length;
    points.push({ day, date, count });
  }

  return points;
}

/** Soft mock rhythm when the archive is still quiet. */
export function buildMockCulturalRhythm(
  year: number,
  month: number,
): CulturalRhythmPoint[] {
  const totalDays = daysInMonth(year, month);
  const seed = year * 12 + month;

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const wave = Math.sin((day + seed) * 0.45) * 0.9 + 1.1;
    const pulse = day % 5 === 0 ? 1.4 : day % 3 === 0 ? 0.7 : 0.35;
    const count = Math.max(0, Math.round(wave * pulse));

    return {
      day,
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      count,
    };
  });
}

export function resolveCulturalRhythm(
  items: MediaItem[],
  year: number,
  month: number,
): { points: CulturalRhythmPoint[]; isMock: boolean } {
  const points = computeCulturalRhythm(items, year, month);
  const activeDays = points.filter((point) => point.count > 0).length;
  const total = points.reduce((sum, point) => sum + point.count, 0);

  if (activeDays < 3 || total < 2) {
    return { points: buildMockCulturalRhythm(year, month), isMock: true };
  }

  return { points, isMock: false };
}

export function maxCount(points: CulturalRhythmPoint[]): number {
  return Math.max(1, ...points.map((point) => point.count));
}
