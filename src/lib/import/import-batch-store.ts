"use client";

import { useSyncExternalStore } from "react";

import {
  restoreUserContent,
  removeUserContent,
  type UserContentItem,
} from "@/lib/content/user-content-store";
import { removeMemory } from "@/lib/content/memory-store";
import type { UserMediaState } from "@/lib/content/user-media-state";
import {
  removeUserMediaState,
  upsertUserMediaState,
} from "@/lib/content/user-media-state";
import type { ImportBatch } from "@/lib/import/import-types";
import type { MediaItem } from "@/types/media";

const BATCH_KEY = "muselog-import-batches-v1";
const UNDO_SNAPSHOT_KEY = "muselog-import-undo-content-v1";
const MAX_HISTORY = 5;
const SERVER_SNAPSHOT: ImportBatch[] = [];

let cachedImportHistory: ImportBatch[] = [];
let cacheInitialized = false;

type UndoSnapshot = {
  batchId: string;
  content: Record<string, UserContentItem>;
};

function syncCacheFromStorage() {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(BATCH_KEY);
    const parsed = raw ? (JSON.parse(raw) as ImportBatch[]) : [];
    const next = Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];

    if (JSON.stringify(next) !== JSON.stringify(cachedImportHistory)) {
      cachedImportHistory = next;
    }
  } catch {
    if (cachedImportHistory.length > 0) {
      cachedImportHistory = [];
    }
  }
}

function ensureCacheInitialized() {
  if (cacheInitialized || typeof window === "undefined") return;
  syncCacheFromStorage();
  cacheInitialized = true;
}

function getImportHistorySnapshot(): ImportBatch[] {
  ensureCacheInitialized();
  return cachedImportHistory;
}

function writeBatches(batches: ImportBatch[]) {
  cachedImportHistory = batches.slice(0, MAX_HISTORY);
  cacheInitialized = true;
  window.localStorage.setItem(BATCH_KEY, JSON.stringify(cachedImportHistory));
  window.dispatchEvent(new CustomEvent("muselog-import-batches-updated"));
}

export function snapshotUserStateMap(): Record<string, UserMediaState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("muselog-user-media-state-v1");
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserMediaState>;
  } catch {
    return {};
  }
}

export function addImportBatch(
  batch: ImportBatch,
  contentSnapshot: Record<string, UserContentItem>,
) {
  const undoSnapshot: UndoSnapshot = {
    batchId: batch.id,
    content: contentSnapshot,
  };
  window.localStorage.setItem(UNDO_SNAPSHOT_KEY, JSON.stringify(undoSnapshot));
  ensureCacheInitialized();
  writeBatches([batch, ...cachedImportHistory]);
}

export function getImportHistory(): ImportBatch[] {
  return getImportHistorySnapshot();
}

function readJournalEntries(): MediaItem[] {
  try {
    const raw = window.localStorage.getItem("muselog-journal-entries-v1");
    if (!raw) return [];
    return JSON.parse(raw) as MediaItem[];
  } catch {
    return [];
  }
}

function writeJournalEntries(entries: MediaItem[]) {
  window.localStorage.setItem(
    "muselog-journal-entries-v1",
    JSON.stringify(entries),
  );
  window.dispatchEvent(new CustomEvent("muselog-journal-entries-updated"));
}

export function undoLastImportBatch(): boolean {
  ensureCacheInitialized();
  const batch = cachedImportHistory[0];
  if (!batch) return false;

  const undoRaw = window.localStorage.getItem(UNDO_SNAPSHOT_KEY);
  let contentSnapshot: Record<string, UserContentItem> = {};
  if (undoRaw) {
    try {
      const parsed = JSON.parse(undoRaw) as UndoSnapshot;
      if (parsed.batchId === batch.id) {
        contentSnapshot = parsed.content;
      }
    } catch {
      contentSnapshot = {};
    }
  }

  for (const mediaKey of batch.affectedMediaKeys ?? batch.createdMediaIds) {
    const previous = batch.previousUserStates[mediaKey];
    if (previous) {
      upsertUserMediaState(mediaKey, previous);
    } else {
      removeUserMediaState(mediaKey);
      removeMemory(mediaKey);
    }
  }

  writeJournalEntries(
    readJournalEntries().filter(
      (entry) => !batch.createdJourneyIds.includes(entry.id),
    ),
  );

  for (const contentId of batch.createdUserContentIds) {
    if (!contentSnapshot[contentId]) {
      removeUserContent(contentId);
    }
  }

  restoreUserContent(contentSnapshot);
  writeBatches(cachedImportHistory.slice(1));
  window.localStorage.removeItem(UNDO_SNAPSHOT_KEY);

  return true;
}

export function useImportHistory() {
  return useSyncExternalStore(
    (cb) => {
      const handler = () => cb();
      window.addEventListener("muselog-import-batches-updated", handler);
      return () =>
        window.removeEventListener("muselog-import-batches-updated", handler);
    },
    getImportHistorySnapshot,
    () => SERVER_SNAPSHOT,
  );
}
