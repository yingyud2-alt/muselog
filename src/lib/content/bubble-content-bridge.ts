import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import type { JourneyColor, MediaItem, MediaType } from "@/types/media";
import { TYPE_JOURNEY_COLORS } from "@/types/media";

import { CONTENT_CATALOG } from "./content-data";
import type { Content, ContentType } from "./types";
import { workToExploreContent } from "@/lib/explore/explore-content-provider";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWorkId,
} from "@/lib/work/resolve-canonical-work";
import { getImportedWorkById } from "@/lib/work/imported-work-catalog";
import { isDisplayableApiWork } from "@/lib/work/displayable-api-work";

const CONTENT_TO_MEDIA: Record<ContentType, MediaType> = {
  BOOK: "book",
  MOVIE: "movie",
  MUSIC: "music",
};

const BUBBLE_TYPE_TO_CONTENT: Partial<Record<WorkBubble["type"], ContentType>> = {
  BOOK: "BOOK",
  MOVIE: "MOVIE",
  MUSIC: "MUSIC",
};

export function findCatalogContentForBubble(work: WorkBubble): Content | null {
  if (work.workId) {
    const imported = getImportedWorkById(work.workId);
    if (imported && isDisplayableApiWork(imported)) {
      return workToExploreContent(imported);
    }
  }

  const contentType = BUBBLE_TYPE_TO_CONTENT[work.type];
  if (!contentType) return null;

  // Title match against imported API catalog only — never mock CONTENT_CATALOG.
  // (CONTENT_CATALOG kept for legacy getContentByMediaKey migration helpers.)
  return null;
}

export function resolveBubbleMediaKey(work: WorkBubble): string {
  if (work.workId?.trim()) {
    return resolveCanonicalWorkId({
      workId: work.workId,
      title: work.title,
      creator: work.creator,
      type: work.type,
    });
  }

  return resolveCanonicalWorkId({
    workId: `bubble-${work.id}`,
    title: work.title,
    creator: work.creator,
    type: work.type,
  });
}

export function resolveJournalItemId(mediaKey: string): string {
  return `journal-${mediaKey}`;
}

export function bubbleTypeToMediaType(type: WorkBubble["type"]): MediaType {
  const contentType = BUBBLE_TYPE_TO_CONTENT[type];
  if (!contentType) return "book";
  return CONTENT_TO_MEDIA[contentType];
}

export function defaultJourneyColorForWork(work: WorkBubble): JourneyColor {
  return TYPE_JOURNEY_COLORS[bubbleTypeToMediaType(work.type)];
}

export function buildJournalItemFromWork(
  work: WorkBubble,
  partial: Partial<MediaItem> & Pick<MediaItem, "status" | "date">,
): MediaItem {
  const content = findCatalogContentForBubble(work);
  const mediaKey = resolveBubbleMediaKey(work);

  return {
    ...partial,
    id: resolveJournalItemId(mediaKey),
    type: bubbleTypeToMediaType(work.type),
    title: work.title,
    creator: work.creator,
    cover: resolveCanonicalCoverUrl({
      workId: mediaKey,
      title: work.title,
      creator: work.creator,
      type: work.type,
      catalogCover: content?.cover,
      journalCover: partial.cover,
    }),
    quote: partial.quote ?? work.quote,
    note: partial.note ?? "",
    tags: partial.tags ?? (content?.tags ?? []).slice(0, 3),
    rating: partial.rating ?? 0,
    memories: partial.memories ?? [],
    journeyColor: partial.journeyColor ?? defaultJourneyColorForWork(work),
  };
}

export function mediaKeyFromJournalItemId(journalItemId: string): string {
  return journalItemId.replace(/^journal-/, "");
}

export function getContentByMediaKey(mediaKey: string): Content | null {
  if (mediaKey.startsWith("bubble-")) return null;
  const imported = getImportedWorkById(mediaKey);
  if (imported && isDisplayableApiWork(imported)) {
    return workToExploreContent(imported);
  }
  // Legacy lookup for migration only — callers on live surfaces should use API ids.
  return CONTENT_CATALOG.find((entry) => entry.id === mediaKey) ?? null;
}

export function contentTypeToMediaType(type: ContentType): MediaType {
  return CONTENT_TO_MEDIA[type];
}

export function mediaTypeToContentType(type: MediaType): ContentType {
  if (type === "book") return "BOOK";
  if (type === "movie") return "MOVIE";
  return "MUSIC";
}

export function defaultJourneyColorForType(type: LibraryMediaTypeLike): JourneyColor {
  const mediaType =
    type === "BOOK" ? "book" : type === "MOVIE" ? "movie" : "music";
  return TYPE_JOURNEY_COLORS[mediaType];
}

type LibraryMediaTypeLike = "BOOK" | "MOVIE" | "MUSIC";

export function buildJournalItemFromMediaKey(
  mediaKey: string,
  partial: Partial<MediaItem> & Pick<MediaItem, "status" | "date">,
  fallback?: {
    title: string;
    creator: string;
    cover?: string;
    type: LibraryMediaTypeLike;
    quote?: string;
    tags?: string[];
  },
): MediaItem {
  const content = getContentByMediaKey(mediaKey);
  const title = content?.title ?? fallback?.title ?? "Untitled";
  const creator = content?.creator ?? fallback?.creator ?? "";
  const typeHint = content?.type ?? fallback?.type ?? "BOOK";
  const type = content
    ? contentTypeToMediaType(content.type)
    : fallback
      ? (fallback.type === "BOOK"
          ? "book"
          : fallback.type === "MOVIE"
            ? "movie"
            : "music")
      : "book";

  // Persist canonical API workId when available (not legacy catalog id).
  const canonicalKey = resolveCanonicalWorkId({
    workId: mediaKey,
    title,
    creator,
    type: typeHint,
  });

  const cover = resolveCanonicalCoverUrl({
    workId: canonicalKey,
    title,
    creator,
    type: typeHint,
    libraryCover: fallback?.cover,
    journalCover: partial.cover,
    catalogCover: content?.cover,
  });

  return {
    ...partial,
    id: resolveJournalItemId(canonicalKey),
    type,
    title: partial.title ?? title,
    creator: partial.creator ?? creator,
    cover,
    quote: partial.quote ?? fallback?.quote ?? "",
    note: partial.note ?? "",
    tags: partial.tags ?? (content?.tags ?? fallback?.tags ?? []).slice(0, 3),
    rating: partial.rating ?? 0,
    memories: partial.memories ?? [],
    journeyColor:
      partial.journeyColor ?? defaultJourneyColorForType(typeHint),
  };
}
