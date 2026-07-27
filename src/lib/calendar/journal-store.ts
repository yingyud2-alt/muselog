"use client";

import { useCallback, useSyncExternalStore } from "react";

import { sanitizeMediaItem } from "@/lib/calendar/journey-utils";
import { ensureReflectiveExplorerDemoSeed } from "@/lib/demo/ensure-demo-seed";
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
  ensureReflectiveExplorerDemoSeed();
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
    const sanitized = sanitizeMediaItem(entry);
    if (!sanitized) return;
    const next = [
      ...cached.filter((item) => item.id !== sanitized.id),
      sanitized,
    ];
    write(next);
  }, []);

  const updateEntry = useCallback(
    (entryId: string, partial: Partial<MediaItem>) => {
      ensureInit();
      const existing = cached.find((item) => item.id === entryId);
      if (!existing) return;
      const sanitized = sanitizeMediaItem({ ...existing, ...partial, id: entryId });
      if (!sanitized) return;
      write(
        cached.map((item) => (item.id === entryId ? sanitized : item)),
      );
    },
    [],
  );

  const removeEntry = useCallback((entryId: string) => {
    ensureInit();
    write(cached.filter((item) => item.id !== entryId));
  }, []);

  return { entries, addEntry, updateEntry, removeEntry };
}

/** Imperative upsert used by calendar drag/resize (same store). */
export function upsertJournalEntry(entry: MediaItem) {
  ensureInit();
  const sanitized = sanitizeMediaItem(entry);
  if (!sanitized) return;
  write([
    ...cached.filter((item) => item.id !== sanitized.id),
    sanitized,
  ]);
}
