import type { NormalizedImportRow } from "@/lib/import/import-types";
import { buildLibraryItems } from "@/lib/library/library-items";
import { getAllMemories } from "@/lib/content/memory-store";
import { normalizeTitle } from "@/lib/import/normalize-media";
import {
  findCatalogMediaKey,
  resolveImportMediaKey,
  resolveMediaKeyByExternalId,
} from "@/lib/import/resolve-media-key";
import type { UserMediaState } from "@/lib/content/user-media-state";
import { mediaKeyFromJournalItemId } from "@/lib/content/bubble-content-bridge";
import type { MediaItem } from "@/types/media";

function readUserStateMap(): Record<string, UserMediaState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("muselog-user-media-state-v1");
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserMediaState>;
  } catch {
    return {};
  }
}

function readJournalEntries(): MediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("muselog-journal-entries-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MediaItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function detectDuplicates(rows: NormalizedImportRow[]): NormalizedImportRow[] {
  const stateMap = readUserStateMap();
  const memories = getAllMemories();
  const journalEntries = readJournalEntries();
  const libraryItems = buildLibraryItems(stateMap, memories, journalEntries);

  const libraryByKey = new Map(
    libraryItems.map((item) => [item.mediaKey, item]),
  );

  const seenInFile = new Map<string, number>();

  return rows.map((row) => {
    if (row.ignored || !row.type || !row.title) return row;

    const mediaKey = resolveImportMediaKey({
      title: row.title,
      creator: row.creator,
      type: row.type,
      externalId: row.externalId,
    });

    const fileKey = `${row.type}|${normalizeTitle(row.title)}|${normalizeTitle(row.creator ?? "")}`;
    if (seenInFile.has(fileKey)) {
      return {
        ...row,
        duplicate: {
          existingMediaId: mediaKey,
          existingTitle: row.title,
          confidence: "LIKELY",
          resolution: "SKIP",
        },
        resolvedMediaKey: mediaKey,
      };
    }
    seenInFile.set(fileKey, row.rowNumber);

    if (row.externalId) {
      const byExternal = resolveMediaKeyByExternalId(row.externalId);
      if (byExternal && libraryByKey.has(byExternal)) {
        const existing = libraryByKey.get(byExternal)!;
        return {
          ...row,
          duplicate: {
            existingMediaId: byExternal,
            existingTitle: existing.title,
            confidence: "EXACT",
            resolution: "SKIP",
          },
          resolvedMediaKey: byExternal,
        };
      }
    }

    const catalogKey = findCatalogMediaKey(
      row.title,
      row.creator ?? "",
      row.type,
    );
    const candidateKey = catalogKey ?? mediaKey;

    if (libraryByKey.has(candidateKey)) {
      const existing = libraryByKey.get(candidateKey)!;
      const exact =
        normalizeTitle(existing.title) === normalizeTitle(row.title) &&
        normalizeTitle(existing.creator) === normalizeTitle(row.creator ?? "");

      return {
        ...row,
        duplicate: {
          existingMediaId: candidateKey,
          existingTitle: existing.title,
          confidence: exact ? "EXACT" : "LIKELY",
          resolution: "SKIP",
        },
        resolvedMediaKey: candidateKey,
      };
    }

    for (const entry of journalEntries) {
      const key = mediaKeyFromJournalItemId(entry.id);
      if (
        key === candidateKey ||
        (normalizeTitle(entry.title) === normalizeTitle(row.title) &&
          normalizeTitle(entry.creator) === normalizeTitle(row.creator ?? ""))
      ) {
        return {
          ...row,
          duplicate: {
            existingMediaId: key,
            existingTitle: entry.title,
            confidence: "EXACT",
            resolution: "SKIP",
          },
          resolvedMediaKey: key,
        };
      }
    }

    return { ...row, resolvedMediaKey: candidateKey };
  });
}

export function snapshotPreviousState(mediaKey: string): UserMediaState | null {
  const map = readUserStateMap();
  return map[mediaKey] ?? null;
}
