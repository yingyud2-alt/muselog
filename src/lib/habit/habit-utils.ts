import { DISPLAY_REFERENCE_DATE } from "@/lib/display-date";
import { hasMuseActivity } from "@/lib/habit/habit-mock";
import type { HabitLog } from "@/types/habit";

export function getDisplayTodayString(): string {
  const year = DISPLAY_REFERENCE_DATE.getUTCFullYear();
  const month = String(DISPLAY_REFERENCE_DATE.getUTCMonth() + 1).padStart(2, "0");
  const day = String(DISPLAY_REFERENCE_DATE.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export type MonthHabitStats = {
  readCount: number;
  watchCount: number;
  listenCount: number;
  streak: number;
  readingRatio: number;
  watchingRatio: number;
  listeningRatio: number;
  readingMinutes: number;
  watchingMinutes: number;
};

function isInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split("-").map(Number);
  return y === year && m === month;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function computeMonthHabitStats(
  logs: HabitLog[],
  year: number,
  month: number,
): MonthHabitStats {
  const monthLogs = logs.filter((log) => isInMonth(log.date, year, month));
  const daysInMonth = getDaysInMonth(year, month);

  const readCount = monthLogs.filter((log) => log.read).length;
  const watchCount = monthLogs.filter((log) => log.watch).length;
  const listenCount = monthLogs.filter((log) => log.listen).length;

  const readingRatio = Math.min(1, readCount / daysInMonth);
  const watchingRatio = Math.min(1, watchCount / daysInMonth);
  const listeningRatio = Math.min(1, listenCount / daysInMonth);

  const readingMinutes = monthLogs
    .filter((log) => log.read)
    .reduce((sum, log) => sum + log.duration, 0);
  const watchingMinutes = monthLogs
    .filter((log) => log.watch)
    .reduce((sum, log) => sum + log.duration, 0);

  const streak = computeMuseStreak(logs, getDisplayTodayString());

  return {
    readCount,
    watchCount,
    listenCount,
    streak,
    readingRatio,
    watchingRatio,
    listeningRatio,
    readingMinutes,
    watchingMinutes,
  };
}

export function computeMuseStreak(
  logs: HabitLog[],
  endDate: string,
): number {
  const activeDates = new Set(
    logs.filter(hasMuseActivity).map((log) => log.date),
  );

  let streak = 0;
  let cursor = endDate;

  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = shiftDateString(cursor, -1);
  }

  return streak;
}

function shiftDateString(date: string, deltaDays: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + deltaDays));

  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export function hasMusedToday(logs: HabitLog[], today: string): boolean {
  const log = logs.find((entry) => entry.date === today);
  return log ? hasMuseActivity(log) : false;
}

export type HabitDot = "read" | "watch" | "listen";

export function getHabitDotsForDate(log: HabitLog | null): HabitDot[] {
  if (!log) {
    return [];
  }

  const dots: HabitDot[] = [];

  if (log.read) {
    dots.push("read");
  }

  if (log.watch) {
    dots.push("watch");
  }

  if (log.listen) {
    dots.push("listen");
  }

  return dots;
}

export function formatHabitMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}
