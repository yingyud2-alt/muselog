import {
  getContentByMediaKey,
  mediaKeyFromJournalItemId,
  mediaTypeToContentType,
} from "@/lib/content/bubble-content-bridge";
import { getUserContentById } from "@/lib/content/user-content-store";
import type { Memory } from "@/lib/content/types";
import type {
  LibraryItem,
  LibraryMediaType,
  LibrarySort,
  LibraryStats,
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";
import type {
  UserMediaState,
  UserMediaStatus,
} from "@/lib/content/user-media-state";
import type { MediaItem, MediaStatus } from "@/types/media";

function memoryStatusToUser(status: Memory["status"]): UserMediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "READING") return "ONGOING";
  if (status === "COMPLETED") return "FINISHED";
  return "NONE";
}

function journalStatusToUser(status: MediaStatus): UserMediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "READING") return "ONGOING";
  return "FINISHED";
}

function resolveStatus(
  stored: UserMediaState | undefined,
  memory: Memory | undefined,
  journal: MediaItem | undefined,
): UserMediaStatus {
  if (journal) return journalStatusToUser(journal.status);
  if (stored?.status && stored.status !== "NONE") return stored.status;
  if (memory) return memoryStatusToUser(memory.status);
  return "NONE";
}

function isoNow(): string {
  return new Date().toISOString();
}

export function buildLibraryItems(
  stateMap: Record<string, UserMediaState>,
  memories: Memory[],
  journalEntries: MediaItem[],
): LibraryItem[] {
  const memoryById = new Map(memories.map((memory) => [memory.contentId, memory]));
  const journalByKey = new Map<string, MediaItem>();

  for (const entry of journalEntries) {
    const key = mediaKeyFromJournalItemId(entry.id);
    if (!key.startsWith("calendar-")) {
      journalByKey.set(key, entry);
    }
  }

  const keys = new Set<string>();

  for (const [key, state] of Object.entries(stateMap)) {
    if (state.status !== "NONE") keys.add(key);
  }

  for (const memory of memories) {
    if (memory.status !== "DROPPED") keys.add(memory.contentId);
  }

  for (const key of journalByKey.keys()) {
    keys.add(key);
  }

  const items: LibraryItem[] = [];

  for (const mediaKey of keys) {
    const stored = stateMap[mediaKey];
    const memory = memoryById.get(mediaKey);
    const journal = journalByKey.get(mediaKey);
    const content = getContentByMediaKey(mediaKey);
    const userContent = getUserContentById(mediaKey);
    const status = resolveStatus(stored, memory, journal);

    if (status === "NONE") continue;

    const type: LibraryMediaType =
      content?.type ??
      userContent?.type ??
      stored?.mediaType ??
      (journal?.type === "book"
        ? "BOOK"
        : journal?.type === "movie"
          ? "MOVIE"
          : "MUSIC");

    const title =
      content?.title ??
      userContent?.title ??
      stored?.title ??
      journal?.title ??
      "Untitled";

    const creator =
      content?.creator ?? userContent?.creator ?? stored?.creator ?? journal?.creator ?? "";

    const cover =
      content?.cover ??
      userContent?.cover ??
      stored?.cover ??
      journal?.cover ??
      "from-slate-800 via-slate-900 to-black";

    items.push({
      mediaKey,
      contentId: content?.id ?? userContent?.id ?? (mediaKey.startsWith("bubble-") ? null : mediaKey),
      title,
      creator,
      cover,
      type,
      status,
      progress: stored?.progress,
      rating:
        (journal?.rating && journal.rating > 0 ? journal.rating : undefined) ??
        stored?.rating ??
        memory?.rating,
      shortReview:
        stored?.shortReview ??
        journal?.note ??
        memory?.note,
      notes: stored?.notes,
      startDate:
        stored?.startDate ??
        journal?.startDate ??
        journal?.date,
      endDate: stored?.endDate ?? journal?.endDate,
      addedToJournal: Boolean(journal ?? stored?.addedToJournal),
      createdAt:
        stored?.createdAt ??
        memory?.createdAt ??
        isoNow(),
      updatedAt:
        stored?.updatedAt ??
        memory?.updatedAt ??
        memory?.createdAt ??
        isoNow(),
    });
  }

  return items;
}

export function computeLibraryStats(items: LibraryItem[]): LibraryStats {
  return {
    total: items.length,
    want: items.filter((item) => item.status === "WANT").length,
    ongoing: items.filter((item) => item.status === "ONGOING").length,
    finished: items.filter((item) => item.status === "FINISHED").length,
  };
}

export function filterLibraryItems(
  items: LibraryItem[],
  query: string,
  typeFilter: LibraryTypeFilter,
  statusFilter: LibraryStatusFilter,
): LibraryItem[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;

    if (!normalized) return true;

    const haystack = [
      item.title,
      item.creator,
      item.shortReview ?? "",
      item.notes ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function sortLibraryItems(
  items: LibraryItem[],
  sort: LibrarySort,
): LibraryItem[] {
  const sorted = [...items];

  sorted.sort((left, right) => {
    switch (sort) {
      case "recently-added":
        return right.createdAt.localeCompare(left.createdAt);
      case "title":
        return left.title.localeCompare(right.title);
      case "highest-rated":
        return (right.rating ?? 0) - (left.rating ?? 0);
      case "recently-updated":
      default:
        return right.updatedAt.localeCompare(left.updatedAt);
    }
  });

  return sorted;
}

export function contentTypeFromLibraryType(type: LibraryMediaType) {
  return mediaTypeToContentType(
    type === "BOOK" ? "book" : type === "MOVIE" ? "movie" : "music",
  );
}
