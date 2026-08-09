import {
  getContentByMediaKey,
  mediaKeyFromJournalItemId,
  mediaTypeToContentType,
} from "@/lib/content/bubble-content-bridge";
import {
  CONTENT_TYPE_LABELS,
  EXPLORE_MOODS,
} from "@/lib/content/constants";
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
import { isApiBackedSource } from "@/lib/work/content-layers";
import { isDisplayableApiWork } from "@/lib/work/displayable-api-work";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
  resolveCanonicalWorkId,
} from "@/lib/work/resolve-canonical-work";
import type { MediaItem, MediaStatus } from "@/types/media";

function memoryStatusToUser(status: Memory["status"]): UserMediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "READING") return "ONGOING";
  if (status === "COMPLETED") return "FINISHED";
  if (status === "DROPPED") return "DROPPED";
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
    keys.add(memory.contentId);
  }

  for (const key of journalByKey.keys()) {
    keys.add(key);
  }

  const byCanonical = new Map<string, LibraryItem>();

  for (const mediaKey of keys) {
    const stored = stateMap[mediaKey];
    const memory = memoryById.get(mediaKey);
    const content = getContentByMediaKey(mediaKey);
    const userContent = getUserContentById(mediaKey);

    const titleHint =
      content?.title ??
      userContent?.title ??
      stored?.title ??
      journalByKey.get(mediaKey)?.title ??
      "";
    const creatorHint =
      content?.creator ??
      userContent?.creator ??
      stored?.creator ??
      journalByKey.get(mediaKey)?.creator ??
      "";
    const typeHint =
      content?.type ??
      userContent?.type ??
      stored?.mediaType ??
      (() => {
        const journal = journalByKey.get(mediaKey);
        if (!journal) return undefined;
        return journal.type === "book"
          ? "BOOK"
          : journal.type === "movie"
            ? "MOVIE"
            : "MUSIC";
      })();

    const canonicalKey = resolveCanonicalWorkId({
      workId: mediaKey,
      title: titleHint,
      creator: creatorHint,
      type: typeHint,
    });

    const journal =
      journalByKey.get(mediaKey) ?? journalByKey.get(canonicalKey);
    const status = resolveStatus(stored, memory, journal);
    if (status === "NONE") continue;

    const canonical = resolveCanonicalWork({
      workId: canonicalKey,
      title: titleHint || journal?.title,
      creator: creatorHint || journal?.creator,
      type: typeHint,
    });

    // Live Library shows only real API-backed Works — keep user state stored.
    if (!canonical || !isDisplayableApiWork(canonical)) {
      continue;
    }

    const type: LibraryMediaType =
      (canonical
        ? canonical.type === "movie"
          ? "MOVIE"
          : canonical.type === "music"
            ? "MUSIC"
            : "BOOK"
        : undefined) ??
      typeHint ??
      "BOOK";

    const title =
      (canonical && isApiBackedSource(canonical.source)
        ? canonical.title
        : undefined) ??
      content?.title ??
      userContent?.title ??
      stored?.title ??
      journal?.title ??
      "Untitled";

    const creator =
      (canonical && isApiBackedSource(canonical.source)
        ? canonical.creator
        : undefined) ??
      content?.creator ??
      userContent?.creator ??
      stored?.creator ??
      journal?.creator ??
      "";

    const cover = resolveCanonicalCoverUrl({
      workId: canonicalKey,
      title,
      creator,
      type,
      libraryCover: stored?.cover ?? userContent?.cover,
      journalCover: journal?.cover,
      catalogCover: content?.cover,
    });

    const nextItem: LibraryItem = {
      mediaKey: canonicalKey,
      contentId:
        (canonical && isApiBackedSource(canonical.source)
          ? canonical.id
          : null) ??
        content?.id ??
        userContent?.id ??
        (mediaKey.startsWith("bubble-") ? null : mediaKey),
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
      notes: stored?.droppedReason ?? stored?.notes,
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
    };

    const existing = byCanonical.get(canonicalKey);
    if (!existing) {
      byCanonical.set(canonicalKey, nextItem);
      continue;
    }

    // Merge duplicate legacy + API rows for the same work.
    byCanonical.set(canonicalKey, {
      ...existing,
      ...nextItem,
      cover: resolveCanonicalCoverUrl({
        workId: canonicalKey,
        title: nextItem.title,
        creator: nextItem.creator,
        type: nextItem.type,
        libraryCover: nextItem.cover,
        journalCover: existing.cover,
      }),
      rating: nextItem.rating ?? existing.rating,
      shortReview: nextItem.shortReview || existing.shortReview,
      notes: nextItem.notes || existing.notes,
      startDate: nextItem.startDate ?? existing.startDate,
      endDate: nextItem.endDate ?? existing.endDate,
      addedToJournal: existing.addedToJournal || nextItem.addedToJournal,
      createdAt: existing.createdAt < nextItem.createdAt
        ? existing.createdAt
        : nextItem.createdAt,
      updatedAt: existing.updatedAt > nextItem.updatedAt
        ? existing.updatedAt
        : nextItem.updatedAt,
    });
  }

  return Array.from(byCanonical.values());
}

export function computeLibraryStats(items: LibraryItem[]): LibraryStats {
  return {
    total: items.length,
    want: items.filter((item) => item.status === "WANT").length,
    ongoing: items.filter((item) => item.status === "ONGOING").length,
    finished: items.filter((item) => item.status === "FINISHED").length,
    dropped: items.filter((item) => item.status === "DROPPED").length,
  };
}

function getLibraryItemTags(item: LibraryItem): string[] {
  const catalog = getContentByMediaKey(item.mediaKey);
  const userContent = getUserContentById(item.mediaKey);
  return [...(catalog?.tags ?? []), ...(userContent?.tags ?? [])];
}

function matchesLibraryQuery(item: LibraryItem, normalized: string): boolean {
  if (
    item.title.toLowerCase().includes(normalized) ||
    item.creator.toLowerCase().includes(normalized) ||
    (item.shortReview ?? "").toLowerCase().includes(normalized) ||
    (item.notes ?? "").toLowerCase().includes(normalized)
  ) {
    return true;
  }

  const typeLabel = CONTENT_TYPE_LABELS[item.type].toLowerCase();
  if (
    typeLabel.includes(normalized) ||
    item.type.toLowerCase().includes(normalized)
  ) {
    return true;
  }

  const tags = getLibraryItemTags(item);
  if (tags.some((tag) => tag.toLowerCase().includes(normalized))) {
    return true;
  }

  return EXPLORE_MOODS.some((mood) => {
    const moodHit =
      mood.id.includes(normalized) ||
      mood.label.toLowerCase().includes(normalized);
    if (!moodHit) return false;
    return mood.tagMatch.some((tag) =>
      tags.some((itemTag) => itemTag.toLowerCase().includes(tag)),
    );
  });
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
    return matchesLibraryQuery(item, normalized);
  });
}

export function getLibraryItemReason(item: LibraryItem): string | null {
  const tags = getLibraryItemTags(item);
  if (tags.length === 0) return null;
  return tags[0];
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
