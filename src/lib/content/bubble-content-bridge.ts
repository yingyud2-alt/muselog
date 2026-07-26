import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import type { JourneyColor, MediaItem, MediaType } from "@/types/media";
import { TYPE_JOURNEY_COLORS } from "@/types/media";

import { CONTENT_CATALOG } from "./content-data";
import type { Content, ContentType } from "./types";

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
  const contentType = BUBBLE_TYPE_TO_CONTENT[work.type];
  if (!contentType) return null;

  return (
    CONTENT_CATALOG.find(
      (entry) =>
        entry.type === contentType &&
        entry.title.toLowerCase() === work.title.toLowerCase() &&
        entry.creator.toLowerCase() === work.creator.toLowerCase(),
    ) ?? null
  );
}

export function resolveBubbleMediaKey(work: WorkBubble): string {
  return findCatalogContentForBubble(work)?.id ?? `bubble-${work.id}`;
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
    id: resolveJournalItemId(mediaKey),
    type: bubbleTypeToMediaType(work.type),
    title: work.title,
    creator: work.creator,
    cover: content?.cover ?? "from-slate-800 via-slate-900 to-black",
    quote: work.quote,
    note: "",
    tags: (content?.tags ?? []).slice(0, 3),
    rating: 0,
    memories: [],
    journeyColor: defaultJourneyColorForWork(work),
    ...partial,
  };
}

export function mediaKeyFromJournalItemId(journalItemId: string): string {
  return journalItemId.replace(/^journal-/, "");
}
