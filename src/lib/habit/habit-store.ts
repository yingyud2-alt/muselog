"use client";

import { useCallback, useSyncExternalStore } from "react";

import { HABIT_SEED_LOGS } from "@/lib/habit/habit-mock";
import type { HabitLog, QuickLogInput } from "@/types/habit";

const STORAGE_KEY = "muselog-habit-logs-v1";
const EMPTY_LOGS: HabitLog[] = [];

let cachedLogs: HabitLog[] = EMPTY_LOGS;
let cacheInitialized = false;

function readLogsFromStorage(): HabitLog[] {
  if (typeof window === "undefined") {
    return EMPTY_LOGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_LOGS;
    }

    const parsed = JSON.parse(raw) as HabitLog[];

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY_LOGS;
  } catch {
    return EMPTY_LOGS;
  }
}

function ensureCacheInitialized(): void {
  if (cacheInitialized || typeof window === "undefined") {
    return;
  }

  const stored = readLogsFromStorage();

  if (stored.length === 0) {
    cachedLogs = HABIT_SEED_LOGS;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(HABIT_SEED_LOGS));
  } else {
    cachedLogs = stored;
  }

  cacheInitialized = true;
}

function reloadCacheFromStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored = readLogsFromStorage();
  cachedLogs = stored.length > 0 ? stored : HABIT_SEED_LOGS;
  cacheInitialized = true;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureCacheInitialized();

  const handleUpdate = () => {
    reloadCacheFromStorage();
    callback();
  };

  window.addEventListener("muselog-habit-updated", handleUpdate);

  return () => {
    window.removeEventListener("muselog-habit-updated", handleUpdate);
  };
}

function writeLogs(logs: HabitLog[]): void {
  cachedLogs = logs.length > 0 ? logs : EMPTY_LOGS;
  cacheInitialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent("muselog-habit-updated"));
}

export function getAllHabitLogs(): HabitLog[] {
  ensureCacheInitialized();
  return cachedLogs;
}

export function upsertHabitLog(date: string, input: QuickLogInput): HabitLog {
  ensureCacheInitialized();

  const logs = cachedLogs === EMPTY_LOGS ? [...HABIT_SEED_LOGS] : [...cachedLogs];
  const existingIndex = logs.findIndex((log) => log.date === date);

  const next: HabitLog = {
    id: existingIndex >= 0 ? logs[existingIndex].id : `habit-${date.replace(/-/g, "")}`,
    date,
    read: input.read,
    watch: input.watch,
    listen: input.listen,
    duration: input.duration,
    photo: input.photo ?? (existingIndex >= 0 ? logs[existingIndex].photo : undefined),
  };

  if (existingIndex >= 0) {
    logs[existingIndex] = { ...logs[existingIndex], ...next };
  } else {
    logs.push(next);
  }

  writeLogs(logs);

  return next;
}

export function useHabitLogs() {
  const logs = useSyncExternalStore(
    subscribe,
    getAllHabitLogs,
    () => EMPTY_LOGS,
  );

  const saveLog = useCallback(
    (date: string, input: QuickLogInput) => upsertHabitLog(date, input),
    [],
  );

  return { logs, saveLog };
}
