"use client";

import type { MediaStatus } from "@/types/media";
import {
  buildJournalItemFromMediaKey,
  getContentByMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { upsertMemory } from "@/lib/content/memory-store";
import {
  snapshotUserContent,
  upsertUserContent,
  type UserContentItem,
} from "@/lib/content/user-content-store";
import type { UserMediaState } from "@/lib/content/user-media-state";
import {
  upsertUserMediaState,
} from "@/lib/content/user-media-state";
import type {
  ImportBatch,
  ImportExecutionResult,
  NormalizedImportRow,
} from "@/lib/import/import-types";
import { isRowReady } from "@/lib/import/validate-import-row";
import {
  registerExternalId,
  resolveImportMediaKey,
} from "@/lib/import/resolve-media-key";
import { addImportBatch, snapshotUserStateMap } from "@/lib/import/import-batch-store";

function coverClassForImport(cover?: string): string {
  if (cover && !cover.startsWith("http")) return cover;
  return "from-slate-800 via-slate-900 to-black";
}

function userStatusToMemoryStatus(
  status: NonNullable<NormalizedImportRow["status"]>,
): "WANT" | "READING" | "COMPLETED" {
  if (status === "WANT") return "WANT";
  if (status === "ONGOING") return "READING";
  return "COMPLETED";
}

function userStatusToJournalStatus(
  status: NonNullable<NormalizedImportRow["status"]>,
): MediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "ONGOING") return "READING";
  return "FINISHED";
}

function shouldCreateJournal(row: NormalizedImportRow): boolean {
  if (!row.status || row.status === "WANT") return false;
  if (row.status === "ONGOING") return Boolean(row.startDate);
  return Boolean(row.startDate || row.endDate);
}

function mergeUserState(
  existing: UserMediaState | null,
  incoming: Partial<UserMediaState>,
): Partial<UserMediaState> {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,
    rating: incoming.rating ?? existing.rating,
    shortReview: incoming.shortReview ?? existing.shortReview,
    notes: incoming.notes ?? existing.notes,
    progress: incoming.progress ?? existing.progress,
    startDate: incoming.startDate ?? existing.startDate,
    endDate: incoming.endDate ?? existing.endDate,
  };
}

function readJournalEntries(): import("@/types/media").MediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("muselog-journal-entries-v1");
    if (!raw) return [];
    return JSON.parse(raw) as import("@/types/media").MediaItem[];
  } catch {
    return [];
  }
}

function writeJournalEntries(entries: import("@/types/media").MediaItem[]) {
  window.localStorage.setItem(
    "muselog-journal-entries-v1",
    JSON.stringify(entries),
  );
  window.dispatchEvent(new CustomEvent("muselog-journal-entries-updated"));
}

function addJournalEntry(entry: import("@/types/media").MediaItem) {
  const entries = readJournalEntries().filter((item) => item.id !== entry.id);
  entries.push(entry);
  writeJournalEntries(entries);
}

export async function executeImport(
  rows: NormalizedImportRow[],
  fileName: string,
  fileKind: "csv" | "json",
  onProgress?: (current: number, total: number) => void,
): Promise<ImportExecutionResult> {
  const previousStates = snapshotUserStateMap();
  const previousContent = snapshotUserContent();
  const batchId = crypto.randomUUID();

  const createdMediaIds: string[] = [];
  const affectedMediaKeys: string[] = [];
  const createdJourneyIds: string[] = [];
  const createdUserContentIds: string[] = [];
  const errors: ImportExecutionResult["errors"] = [];

  let imported = 0;
  let skipped = 0;
  let warnings = 0;
  const ignored = rows.filter((row) => row.ignored).length;

  const candidates = rows.filter((row) => !row.ignored);

  for (let index = 0; index < candidates.length; index += 1) {
    const row = candidates[index];
    onProgress?.(index + 1, candidates.length);

    if (!isRowReady(row) || !row.type || !row.status) {
      for (const error of row.errors) {
        errors.push({
          row: row.rowNumber,
          title: row.title,
          errorField: error.field,
          errorMessage: error.message,
          originalValue: error.originalValue,
        });
      }
      continue;
    }

    if (row.duplicate?.resolution === "SKIP") {
      skipped += 1;
      continue;
    }

    const mediaKey =
      row.resolvedMediaKey ??
      resolveImportMediaKey({
        title: row.title,
        creator: row.creator,
        type: row.type,
        externalId: row.externalId,
      });

    const existingState = previousStates[mediaKey] ?? null;
    const isDuplicate = Boolean(row.duplicate);
    const isReplace = row.duplicate?.resolution === "REPLACE";

    if (isDuplicate && !isReplace && row.duplicate?.resolution !== "MERGE") {
      skipped += 1;
      continue;
    }

    const catalog = getContentByMediaKey(mediaKey);
    if (!catalog) {
      const userItem: UserContentItem = {
        id: mediaKey,
        type: row.type,
        title: row.title,
        creator: row.creator ?? "",
        cover: coverClassForImport(row.cover),
        description: row.cover?.startsWith("http") ? row.cover : "",
        tags: [],
        source: "import",
        externalId: row.externalId,
      };
      upsertUserContent(userItem);
      if (!createdUserContentIds.includes(mediaKey)) {
        createdUserContentIds.push(mediaKey);
      }
    }

    if (row.externalId) {
      registerExternalId(row.externalId, mediaKey);
    }

    const nextStatePartial: Partial<UserMediaState> = {
      mediaKey,
      status: row.status,
      progress: row.progress,
      rating: row.rating,
      shortReview: row.shortReview,
      notes: row.notes,
      startDate: row.startDate,
      endDate: row.endDate,
      addedToJournal: shouldCreateJournal(row),
      title: row.title,
      creator: row.creator,
      cover: coverClassForImport(row.cover),
      mediaType: row.type,
    };

    const merged = isDuplicate && row.duplicate?.resolution === "MERGE"
      ? mergeUserState(existingState, nextStatePartial)
      : isReplace
        ? nextStatePartial
        : nextStatePartial;

    upsertUserMediaState(mediaKey, merged);
    if (!affectedMediaKeys.includes(mediaKey)) {
      affectedMediaKeys.push(mediaKey);
    }

    if (catalog || mediaKey.startsWith("import-")) {
      upsertMemory({
        contentId: mediaKey,
        status: userStatusToMemoryStatus(row.status),
        rating: merged.rating,
        note: merged.shortReview ?? merged.notes,
      });
    }

    if (shouldCreateJournal(row)) {
      const journalId = resolveJournalItemId(mediaKey);
      const journalEntry = buildJournalItemFromMediaKey(
        mediaKey,
        {
          status: userStatusToJournalStatus(row.status),
          date: row.startDate ?? row.endDate!,
          startDate: row.startDate ?? row.endDate,
          endDate: row.endDate,
          rating: row.rating ?? 0,
          note: row.shortReview ?? row.notes ?? "",
        },
        {
          title: row.title,
          creator: row.creator ?? "",
          cover: coverClassForImport(row.cover),
          type: row.type,
        },
      );
      addJournalEntry(journalEntry);
      createdJourneyIds.push(journalId);
    }

    if (!existingState) {
      createdMediaIds.push(mediaKey);
    }

    imported += 1;
    if (row.warnings.length > 0) warnings += 1;
  }

  const batch: ImportBatch = {
    id: batchId,
    importedAt: new Date().toISOString(),
    fileName,
    fileKind,
    createdMediaIds,
    affectedMediaKeys,
    previousUserStates: previousStates,
    createdJourneyIds,
    createdUserContentIds,
    status: errors.length > 0 ? "partial" : "completed",
    importedCount: imported,
    skippedCount: skipped,
    warningCount: warnings,
  };

  try {
    addImportBatch(batch, previousContent);
  } catch {
    throw new Error("STORAGE_QUOTA_EXCEEDED");
  }

  return {
    imported,
    skipped,
    warnings,
    ignored,
    errors,
    batch,
  };
}
