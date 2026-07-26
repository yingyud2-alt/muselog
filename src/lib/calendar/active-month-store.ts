"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  CALENDAR_DEFAULT_MONTH,
  CALENDAR_DEFAULT_YEAR,
} from "@/lib/calendar/constants";
import { formatMonthYear } from "@/lib/calendar/utils";

export type ActiveMonth = {
  year: number;
  month: number;
};

const STORAGE_KEY = "muselog-active-month-v1";
const EVENT = "muselog-active-month-updated";

const DEFAULT_MONTH: ActiveMonth = {
  year: CALENDAR_DEFAULT_YEAR,
  month: CALENDAR_DEFAULT_MONTH,
};

let cached: ActiveMonth = DEFAULT_MONTH;
let initialized = false;

function normalize(year: number, month: number): ActiveMonth {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

function read(): ActiveMonth {
  if (typeof window === "undefined") return DEFAULT_MONTH;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MONTH;
    const parsed = JSON.parse(raw) as Partial<ActiveMonth>;
    if (
      typeof parsed.year !== "number" ||
      typeof parsed.month !== "number" ||
      parsed.month < 1 ||
      parsed.month > 12
    ) {
      return DEFAULT_MONTH;
    }
    return normalize(parsed.year, parsed.month);
  } catch {
    return DEFAULT_MONTH;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  cached = read();
  initialized = true;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();
  const handler = () => {
    cached = read();
    initialized = true;
    cb();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

function write(next: ActiveMonth) {
  cached = next;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getActiveMonth(): ActiveMonth {
  ensureInit();
  return cached;
}

export function setActiveMonth(year: number, month: number) {
  ensureInit();
  write(normalize(year, month));
}

export function shiftActiveMonth(delta: number) {
  ensureInit();
  write(normalize(cached.year, cached.month + delta));
}

export function resetActiveMonthToDefault() {
  write(DEFAULT_MONTH);
}

export function useActiveMonth() {
  const active = useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => DEFAULT_MONTH,
  );

  const goPrev = useCallback(() => shiftActiveMonth(-1), []);
  const goNext = useCallback(() => shiftActiveMonth(1), []);
  const setMonth = useCallback((year: number, month: number) => {
    setActiveMonth(year, month);
  }, []);

  return {
    year: active.year,
    month: active.month,
    monthLabel: formatMonthYear(active.year, active.month),
    goPrev,
    goNext,
    setMonth,
  };
}
