import { CONTENT_CATALOG } from "@/lib/content/content-data";
import type { Content, ContentType } from "@/lib/content/types";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { MediaItem, MediaType } from "@/types/media";

export type WaitingTab = "read" | "watch" | "listen";

const TAB_TO_CONTENT: Record<WaitingTab, ContentType> = {
  read: "BOOK",
  watch: "MOVIE",
  listen: "MUSIC",
};

const CONTENT_TO_MEDIA: Record<ContentType, MediaType> = {
  BOOK: "book",
  MOVIE: "movie",
  MUSIC: "music",
};

export function contentTypeToMediaType(type: ContentType): MediaType {
  return CONTENT_TO_MEDIA[type];
}

function getJournalContentIds(items: MediaItem[]): Set<string> {
  const ids = new Set<string>();

  for (const item of items) {
    const exploreId = MEDIA_EXPLORE_IDS[item.id];
    if (exploreId) ids.add(exploreId);
    if (item.id.startsWith("journal-")) {
      ids.add(item.id.replace(/^journal-/, ""));
    }
  }

  return ids;
}

export function getWaitingList(
  items: MediaItem[],
  tab: WaitingTab,
): Content[] {
  const inJournal = getJournalContentIds(items);
  const contentType = TAB_TO_CONTENT[tab];

  return CONTENT_CATALOG.filter(
    (entry) => entry.type === contentType && !inJournal.has(entry.id),
  );
}

export function getDefaultWaitingTab(items: MediaItem[]): WaitingTab {
  const tabs: WaitingTab[] = ["read", "watch", "listen"];
  for (const tab of tabs) {
    if (getWaitingList(items, tab).length > 0) return tab;
  }
  return "read";
}

export function searchWaitingContent(
  items: MediaItem[],
  query: string,
): Content[] {
  const normalized = query.trim().toLowerCase();
  const inJournal = getJournalContentIds(items);

  if (!normalized) {
    return CONTENT_CATALOG.filter((entry) => !inJournal.has(entry.id));
  }

  return CONTENT_CATALOG.filter((entry) => {
    if (inJournal.has(entry.id)) return false;
    if (entry.title.toLowerCase().includes(normalized)) return true;
    if (entry.creator.toLowerCase().includes(normalized)) return true;
    return entry.tags.some((tag) => tag.toLowerCase().includes(normalized));
  });
}

export function contentToJournalItem(
  content: Content,
  startDate: string,
): MediaItem {
  return {
    id: `journal-${content.id}`,
    type: contentTypeToMediaType(content.type),
    title: content.title,
    creator: content.creator,
    cover: content.cover,
    status: "READING",
    rating: 0,
    quote: "",
    note: "",
    tags: (content.tags ?? []).slice(0, 3),
    date: startDate,
    startDate,
    endDate: undefined,
    journeyColor: undefined,
    memories: [],
  };
}
