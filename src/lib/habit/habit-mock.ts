import type { HabitLog } from "@/types/habit";

/** Deterministic seed logs for July 2026 — merged on first store init. */
export const HABIT_SEED_LOGS: HabitLog[] = [
  { id: "habit-0701", date: "2026-07-01", read: true, watch: false, listen: false, duration: 30 },
  { id: "habit-0702", date: "2026-07-02", read: true, watch: false, listen: true, duration: 45 },
  { id: "habit-0703", date: "2026-07-03", read: false, watch: true, listen: false, duration: 120 },
  { id: "habit-0704", date: "2026-07-04", read: true, watch: false, listen: true, duration: 30 },
  { id: "habit-0705", date: "2026-07-05", read: true, watch: false, listen: false, duration: 60 },
  { id: "habit-0706", date: "2026-07-06", read: false, watch: false, listen: true, duration: 30 },
  { id: "habit-0707", date: "2026-07-07", read: true, watch: true, listen: false, duration: 90 },
  { id: "habit-0708", date: "2026-07-08", read: true, watch: false, listen: false, duration: 45 },
  { id: "habit-0709", date: "2026-07-09", read: false, watch: false, listen: true, duration: 15 },
  { id: "habit-0710", date: "2026-07-10", read: true, watch: false, listen: true, duration: 30 },
  { id: "habit-0711", date: "2026-07-11", read: true, watch: false, listen: false, duration: 30 },
  { id: "habit-0712", date: "2026-07-12", read: true, watch: false, listen: false, duration: 45 },
  { id: "habit-0713", date: "2026-07-13", read: false, watch: true, listen: false, duration: 60 },
  { id: "habit-0714", date: "2026-07-14", read: true, watch: false, listen: true, duration: 30 },
  { id: "habit-0715", date: "2026-07-15", read: false, watch: true, listen: false, duration: 90 },
  { id: "habit-0716", date: "2026-07-16", read: false, watch: true, listen: true, duration: 45 },
  { id: "habit-0717", date: "2026-07-17", read: true, watch: false, listen: false, duration: 30 },
  { id: "habit-0718", date: "2026-07-18", read: false, watch: false, listen: true, duration: 60 },
  { id: "habit-0719", date: "2026-07-19", read: true, watch: true, listen: false, duration: 90 },
  { id: "habit-0720", date: "2026-07-20", read: false, watch: false, listen: true, duration: 45 },
  { id: "habit-0721", date: "2026-07-21", read: false, watch: false, listen: true, duration: 30 },
  { id: "habit-0722", date: "2026-07-22", read: true, watch: false, listen: true, duration: 45 },
  { id: "habit-0723", date: "2026-07-23", read: true, watch: false, listen: false, duration: 30 },
];

export function getHabitLogForDate(
  logs: HabitLog[],
  date: string,
): HabitLog | null {
  return logs.find((log) => log.date === date) ?? null;
}

export function hasMuseActivity(log: HabitLog): boolean {
  return log.read || log.watch || log.listen;
}
