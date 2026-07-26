"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_JOURNAL_THEME,
  getJournalThemePalette,
  isJournalThemeId,
  type JournalThemeId,
  type JournalThemePalette,
} from "@/lib/preferences/journal-themes";

/**
 * Persisted Journal visual theme.
 * Storage key mirrors future `user_settings.journalTheme`.
 */
const STORAGE_KEY = "muselog-user-settings-journal-theme-v1";
const EVENT = "muselog-journal-theme-updated";

let cached: JournalThemeId = DEFAULT_JOURNAL_THEME;
let initialized = false;

function read(): JournalThemeId {
  if (typeof window === "undefined") return DEFAULT_JOURNAL_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_JOURNAL_THEME;
    const parsed = JSON.parse(raw) as { journalTheme?: unknown } | unknown;
    if (isJournalThemeId(parsed)) return parsed;
    if (
      parsed &&
      typeof parsed === "object" &&
      isJournalThemeId((parsed as { journalTheme?: unknown }).journalTheme)
    ) {
      return (parsed as { journalTheme: JournalThemeId }).journalTheme;
    }
    return DEFAULT_JOURNAL_THEME;
  } catch {
    return DEFAULT_JOURNAL_THEME;
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

function write(next: JournalThemeId) {
  cached = next;
  initialized = true;
  // Shape ready for user_settings.journalTheme sync
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ journalTheme: next }),
  );
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getJournalTheme(): JournalThemeId {
  ensureInit();
  return cached;
}

export function setJournalTheme(theme: JournalThemeId) {
  if (!isJournalThemeId(theme)) return;
  ensureInit();
  write(theme);
}

export function useJournalTheme(): {
  journalTheme: JournalThemeId;
  palette: JournalThemePalette;
  setJournalTheme: (theme: JournalThemeId) => void;
} {
  const journalTheme = useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => DEFAULT_JOURNAL_THEME,
  );

  const setTheme = useCallback((theme: JournalThemeId) => {
    setJournalTheme(theme);
  }, []);

  return {
    journalTheme,
    palette: getJournalThemePalette(journalTheme),
    setJournalTheme: setTheme,
  };
}
