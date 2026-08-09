"use client";

import { useCallback, useSyncExternalStore } from "react";

import { sanitizeMediaItem } from "@/lib/calendar/journey-utils";
import { resolveJournalWorkId } from "@/lib/calendar/resolve-journal-work-cover";
import { ensureReflectiveExplorerDemoSeed } from "@/lib/demo/ensure-demo-seed";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWorkId,
} from "@/lib/work/resolve-canonical-work";
import type { MediaItem } from "@/types/media";

/**
 * On write: persist canonical API workId when available, and prefer
 * canonical cover without deleting user memory fields.
 */
function withCanonicalIdentity(entry: MediaItem): MediaItem {
  const storedKey = resolveJournalWorkId(entry);
  const canonicalKey = resolveCanonicalWorkId({
    workId: storedKey,
    title: entry.title,
    creator: entry.creator,
    type: entry.type,
  });
  const nextId = entry.id.startsWith("calendar-")
    ? entry.id
    : `journal-${canonicalKey}`;

  const cover = resolveCanonicalCoverUrl({
    workId: canonicalKey,
    title: entry.title,
    creator: entry.creator,
    type: entry.type,
    journalCover: entry.cover,
  });

  return {
    ...entry,
    id: nextId,
    cover,
  };
}

const STORAGE_KEY = "muselog-journal-entries-v1";
const HIDDEN_KEY = "muselog-journal-hidden-v1";
const EMPTY: MediaItem[] = [];
const EMPTY_HIDDEN: string[] = [];

let cached: MediaItem[] = EMPTY;
let initialized = false;

let cachedHidden: string[] = EMPTY_HIDDEN;
let hiddenInitialized = false;

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
    const sanitized = sanitizeMediaItem(withCanonicalIdentity(entry));
    if (!sanitized) return;
    const next = [
      ...cached.filter((item) => item.id !== sanitized.id && item.id !== entry.id),
      sanitized,
    ];
    write(next);
  }, []);

  const updateEntry = useCallback(
    (entryId: string, partial: Partial<MediaItem>) => {
      ensureInit();
      const existing = cached.find((item) => item.id === entryId);
      if (!existing) return;
      const sanitized = sanitizeMediaItem(
        withCanonicalIdentity({ ...existing, ...partial, id: entryId }),
      );
      if (!sanitized) return;
      write(
        cached
          .filter((item) => item.id !== entryId && item.id !== sanitized.id)
          .concat(sanitized),
      );
    },
    [],
  );

  const removeEntry = useCallback((entryId: string) => {
    removeJournalEntry(entryId);
  }, []);

  return { entries, addEntry, updateEntry, removeEntry };
}

function readHidden(): string[] {
  if (typeof window === "undefined") return EMPTY_HIDDEN;
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY);
    if (!raw) return EMPTY_HIDDEN;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_HIDDEN;
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return EMPTY_HIDDEN;
  }
}

function ensureHiddenInit() {
  if (hiddenInitialized || typeof window === "undefined") return;
  cachedHidden = readHidden();
  hiddenInitialized = true;
}

function subscribeHidden(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureHiddenInit();
  const handler = () => {
    cachedHidden = readHidden();
    hiddenInitialized = true;
    cb();
  };
  window.addEventListener("muselog-journal-hidden-updated", handler);
  return () =>
    window.removeEventListener("muselog-journal-hidden-updated", handler);
}

function writeHidden(ids: string[]) {
  cachedHidden = ids;
  hiddenInitialized = true;
  window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("muselog-journal-hidden-updated"));
}

function hideJournalEntry(entryId: string) {
  ensureHiddenInit();
  if (cachedHidden.includes(entryId)) return;
  writeHidden([...cachedHidden, entryId]);
}

/** Calendar subscriptions — hidden mock/seed memories stay removed after delete. */
export function useHiddenJournalIds(): readonly string[] {
  return useSyncExternalStore(
    subscribeHidden,
    () => {
      ensureHiddenInit();
      return cachedHidden;
    },
    () => EMPTY_HIDDEN,
  );
}

/** Imperative upsert used by calendar drag/resize (same store). */
export function upsertJournalEntry(entry: MediaItem) {
  ensureInit();
  const sanitized = sanitizeMediaItem(withCanonicalIdentity(entry));
  if (!sanitized) return;
  write([
    ...cached.filter((item) => item.id !== sanitized.id && item.id !== entry.id),
    sanitized,
  ]);
}

/**
 * Delete a Journal Entry / Memory only.
 * Does not touch Work objects or Library records.
 */
export function removeJournalEntry(entryId: string) {
  if (!entryId.trim()) return;
  ensureInit();
  write(cached.filter((item) => item.id !== entryId));
  hideJournalEntry(entryId);
}
