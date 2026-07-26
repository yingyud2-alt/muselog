import type { HabitLog, MuseActivity } from "@/types/habit";

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDate(year: number, month: number, day: number): string {
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");

  return `${year}-${monthStr}-${dayStr}`;
}

export function buildActivityDotMatrix(
  logs: HabitLog[],
  year: number,
  month: number,
  activity: MuseActivity,
): boolean[] {
  const daysInMonth = getDaysInMonth(year, month);
  const logByDate = new Map(logs.map((log) => [log.date, log]));

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = formatDate(year, month, index + 1);
    const log = logByDate.get(date);

    if (!log) {
      return false;
    }

    return log[activity];
  });
}

export function getActivityLogsForMonth(
  logs: HabitLog[],
  year: number,
  month: number,
  activity: MuseActivity,
): HabitLog[] {
  return logs
    .filter((log) => {
      const [logYear, logMonth] = log.date.split("-").map(Number);

      return logYear === year && logMonth === month && log[activity];
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function formatActivityDayLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));

  return `${monthLabel} ${day}`;
}
