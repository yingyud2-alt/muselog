"use client";

import { useCallback, useSyncExternalStore } from "react";

import { sanitizeMediaItem } from "@/lib/calendar/journey-utils";
import type { MediaItem } from "@/types/media";

const STORAGE_KEY = "muselog-journal-entries-v1";
const EMPTY: MediaItem[] = [];

let cached: MediaItem[] = EMPTY;
let initialized = false;

function read(): MediaItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<MediaItem>[];
    if (!Array.isArray(parsed)) return EMPTY;

    return parsed
      .map((entry) => sanitizeMediaItem(entry))
      .filter((entry): entry is MediaItem => entry !== null);
  } catch {
    return EMPTY;
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
  window.addEventListener("muselog-journal-entries-updated", handler);
  return () => window.removeEventListener("muselog-journal-entries-updated", handler);
}

function write(entries: MediaItem[]) {
  cached = entries;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("muselog-journal-entries-updated"));
}

export function useJournalEntries() {
  const entries = useSyncExternalStore(subscribe, () => {
    ensureInit();
    return cached;
  }, () => EMPTY);

  const addEntry = useCallback((entry: MediaItem) => {
    ensureInit();
    const next = [...cached.filter((item) => item.id !== entry.id), entry];
    write(next);
  }, []);

  const removeEntry = useCallback((entryId: string) => {
    ensureInit();
    write(cached.filter((item) => item.id !== entryId));
  }, []);

  return { entries, addEntry, removeEntry };
}
