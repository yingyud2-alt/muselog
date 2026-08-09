"use client";

import { resolveJournalItemId } from "@/lib/content/bubble-content-bridge";
import { ensureReflectiveExplorerDemoSeed } from "@/lib/demo/ensure-demo-seed";
import {
  isApiBackedSource,
} from "@/lib/work/content-layers";
import { isRemoteCoverUrl, resolveCoverUrl } from "@/lib/work/cover-url";
import {
  isApiWorkId,
  isLegacyCatalogWorkId,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
import { MEDIA_EXPLORE_IDS, type MediaItem } from "@/types/media";
import type { UserMediaState } from "@/lib/content/user-media-state";
import type { Memory } from "@/lib/content/types";

const JOURNAL_KEY = "muselog-journal-entries-v1";
const HIDDEN_KEY = "muselog-journal-hidden-v1";
const MEDIA_KEY = "muselog-user-media-state-v1";
const MEMORIES_KEY = "muselog-memories-v2";
const PHOTOS_KEY = "muselog-memory-photos-v1";
const JOURNEY_KEY = "muselog-media-journeys-v1";

let migrating = false;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown, eventName?: string) {
  window.localStorage.setItem(key, JSON.stringify(value));
  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName));
  }
}

function preferCover(a?: string, b?: string): string | undefined {
  const resolved = resolveCoverUrl(a, b);
  return resolved || a || b || undefined;
}

function resolveLegacyToApiId(input: {
  workId: string;
  title?: string;
  creator?: string;
  type?: string;
}): string | null {
  const canonical = resolveCanonicalWork(input);
  if (!canonical || !isApiBackedSource(canonical.source)) return null;
  if (!isApiWorkId(canonical.id)) return null;
  if (canonical.id === input.workId) return null;
  return canonical.id;
}

function migrateJournalEntries(): number {
  const entries = readJson<Partial<MediaItem>[]>(JOURNAL_KEY, []);
  if (!Array.isArray(entries) || entries.length === 0) return 0;

  let changed = 0;
  const next: MediaItem[] = [];
  const seen = new Set<string>();

  for (const raw of entries) {
    if (!raw || typeof raw !== "object" || !raw.id) continue;
    const entry = raw as MediaItem;
    const storedKey = entry.id.startsWith("journal-")
      ? entry.id.replace(/^journal-/, "")
      : MEDIA_EXPLORE_IDS[entry.id] ?? entry.id;

    if (!isLegacyCatalogWorkId(storedKey) && !entry.id.startsWith("calendar-")) {
      if (!seen.has(entry.id)) {
        next.push(entry);
        seen.add(entry.id);
      }
      continue;
    }

    const apiId = resolveLegacyToApiId({
      workId: storedKey,
      title: entry.title,
      creator: entry.creator,
      type: entry.type,
    });

    if (!apiId) {
      if (!seen.has(entry.id)) {
        next.push(entry);
        seen.add(entry.id);
      }
      continue;
    }

    const nextId = resolveJournalItemId(apiId);
    const existingIdx = next.findIndex((item) => item.id === nextId);
    const migrated: MediaItem = {
      ...entry,
      id: nextId,
      cover: preferCover(
        resolveCanonicalWork({
          workId: apiId,
          title: entry.title,
          creator: entry.creator,
          type: entry.type,
        })?.coverUrl,
        entry.cover,
      ) ?? entry.cover,
    };

    if (existingIdx >= 0) {
      const existing = next[existingIdx]!;
      next[existingIdx] = {
        ...existing,
        ...migrated,
        // Preserve user memory fields from either side.
        note: migrated.note || existing.note,
        notes: migrated.notes || existing.notes,
        quote: migrated.quote || existing.quote,
        tags:
          migrated.tags?.length > 0 ? migrated.tags : existing.tags,
        memories:
          (migrated.memories?.length ?? 0) > 0
            ? migrated.memories
            : existing.memories,
        rating: migrated.rating || existing.rating,
        startDate: migrated.startDate ?? existing.startDate,
        endDate: migrated.endDate ?? existing.endDate,
        date: migrated.date || existing.date,
        cover: preferCover(migrated.cover, existing.cover) ?? migrated.cover,
      };
    } else {
      next.push(migrated);
      seen.add(nextId);
    }

    changed += 1;
  }

  if (changed > 0) {
    writeJson(JOURNAL_KEY, next, "muselog-journal-entries-updated");
  }
  return changed;
}

function migrateHiddenIds(): number {
  const hidden = readJson<string[]>(HIDDEN_KEY, []);
  if (!Array.isArray(hidden) || hidden.length === 0) return 0;

  let changed = 0;
  const next = hidden.map((id) => {
    const key = id.startsWith("journal-")
      ? id.replace(/^journal-/, "")
      : MEDIA_EXPLORE_IDS[id] ?? id;
    if (!isLegacyCatalogWorkId(key) && !id.startsWith("calendar-")) return id;
    const apiId = resolveLegacyToApiId({ workId: key });
    if (!apiId) return id;
    changed += 1;
    return id.startsWith("journal-") || id.startsWith("calendar-")
      ? resolveJournalItemId(apiId)
      : apiId;
  });

  if (changed > 0) {
    writeJson(HIDDEN_KEY, Array.from(new Set(next)), "muselog-journal-hidden-updated");
  }
  return changed;
}

function migrateUserMediaState(): number {
  const map = readJson<Record<string, UserMediaState>>(MEDIA_KEY, {});
  const keys = Object.keys(map);
  if (keys.length === 0) return 0;

  let changed = 0;
  const next: Record<string, UserMediaState> = { ...map };

  for (const mediaKey of keys) {
    if (!isLegacyCatalogWorkId(mediaKey)) continue;
    const state = map[mediaKey];
    if (!state) continue;

    const apiId = resolveLegacyToApiId({
      workId: mediaKey,
      title: state.title,
      creator: state.creator,
      type: state.mediaType,
    });
    if (!apiId) continue;

    const existing = next[apiId];
    const migrated: UserMediaState = {
      ...state,
      ...(existing ?? {}),
      mediaKey: apiId,
      title: existing?.title || state.title,
      creator: existing?.creator || state.creator,
      cover: preferCover(
        resolveCanonicalWork({
          workId: apiId,
          title: state.title,
          creator: state.creator,
          type: state.mediaType,
        })?.coverUrl,
        preferCover(existing?.cover, state.cover),
      ),
      status:
        existing && existing.status !== "NONE" ? existing.status : state.status,
      notes: existing?.notes || state.notes,
      shortReview: existing?.shortReview || state.shortReview,
      rating: existing?.rating ?? state.rating,
      startDate: existing?.startDate ?? state.startDate,
      endDate: existing?.endDate ?? state.endDate,
      progress: existing?.progress ?? state.progress,
      addedToJournal: Boolean(existing?.addedToJournal || state.addedToJournal),
      createdAt: existing?.createdAt ?? state.createdAt,
      updatedAt: existing?.updatedAt ?? state.updatedAt,
    };

    next[apiId] = migrated;
    delete next[mediaKey];
    changed += 1;
  }

  if (changed > 0) {
    writeJson(MEDIA_KEY, next, "muselog-user-media-updated");
  }
  return changed;
}

function migrateMemories(): number {
  const memories = readJson<Memory[]>(MEMORIES_KEY, []);
  if (!Array.isArray(memories) || memories.length === 0) return 0;

  let changed = 0;
  const byContent = new Map<string, Memory>();

  for (const memory of memories) {
    if (!memory?.contentId) continue;
    let contentId = memory.contentId;
    if (isLegacyCatalogWorkId(contentId)) {
      // Memory rows lack title — resolve via catalog id → imported title match.
      const resolved = resolveLegacyToApiId({ workId: contentId });
      if (resolved) {
        contentId = resolved;
        changed += 1;
      }
    }

    const existing = byContent.get(contentId);
    if (!existing) {
      byContent.set(contentId, {
        ...memory,
        id: `memory-${contentId}`,
        contentId,
      });
      continue;
    }

    byContent.set(contentId, {
      ...existing,
      ...memory,
      id: `memory-${contentId}`,
      contentId,
      note: memory.note || existing.note,
      rating: memory.rating ?? existing.rating,
    });
  }

  if (changed > 0) {
    writeJson(
      MEMORIES_KEY,
      Array.from(byContent.values()),
      "muselog-memories-updated",
    );
  }
  return changed;
}

function migrateKeyedRecord(key: string, eventName: string): number {
  const record = readJson<Record<string, unknown>>(key, {});
  const entries = Object.entries(record);
  if (entries.length === 0) return 0;

  let changed = 0;
  const next: Record<string, unknown> = {};

  for (const [id, value] of entries) {
    const storedKey = id.startsWith("journal-")
      ? id.replace(/^journal-/, "")
      : MEDIA_EXPLORE_IDS[id] ?? id;

    if (!isLegacyCatalogWorkId(storedKey) && !id.startsWith("calendar-")) {
      next[id] = value;
      continue;
    }

    const apiId = resolveLegacyToApiId({ workId: storedKey });
    if (!apiId) {
      next[id] = value;
      continue;
    }

    const nextId =
      id.startsWith("journal-") || id.startsWith("calendar-")
        ? resolveJournalItemId(apiId)
        : apiId;

    if (next[nextId] == null) {
      next[nextId] = value;
    }
    changed += 1;
  }

  if (changed > 0) {
    writeJson(key, next, eventName);
  }
  return changed;
}

/**
 * Rewrite legacy catalog workIds in local Journal / Library stores to
 * canonical API Work ids. Never deletes user dates, notes, moods, ratings,
 * or photos — merges when both legacy and API rows exist.
 */
export function migrateCanonicalWorkIds(): {
  migrated: number;
} {
  if (typeof window === "undefined" || migrating) {
    return { migrated: 0 };
  }

  migrating = true;
  try {
    ensureReflectiveExplorerDemoSeed();

    const migrated =
      migrateJournalEntries() +
      migrateHiddenIds() +
      migrateUserMediaState() +
      migrateMemories() +
      migrateKeyedRecord(PHOTOS_KEY, "muselog-memory-photos-updated") +
      migrateKeyedRecord(JOURNEY_KEY, "muselog-journey-updated");

    return { migrated };
  } finally {
    migrating = false;
  }
}

/** Prefer remote API cover onto a library/journal cover field without dropping data. */
export function preferRemoteCover(
  apiCover?: string | null,
  fallback?: string | null,
): string {
  if (isRemoteCoverUrl(apiCover)) return apiCover!.trim();
  return resolveCoverUrl(apiCover, fallback);
}
