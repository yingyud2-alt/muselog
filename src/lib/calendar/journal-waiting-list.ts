import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { getAllUserContent } from "@/lib/content/user-content-store";
import type { Content, ContentType } from "@/lib/content/types";
import { workToExploreContent } from "@/lib/explore/explore-content-provider";
import { filterDisplayableApiWorks } from "@/lib/work/displayable-api-work";
import { listImportedWorks } from "@/lib/work/imported-work-catalog";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { MediaItem, MediaType } from "@/types/media";

function getApiWaitingCatalog(): Content[] {
  return filterDisplayableApiWorks(listImportedWorks()).map((work) =>
    workToExploreContent(work),
  );
}

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

function userContentToWaitingItem(
  id: string,
  type: ContentType,
  title: string,
  creator: string,
  cover: string,
): Content {
  return {
    id,
    type,
    title,
    creator,
    cover,
    description: "",
    tags: [],
    source: "manual",
  };
}

function getUserWantItems(
  inJournal: Set<string>,
  contentType: ContentType,
): Content[] {
  if (typeof window === "undefined") return [];

  let stateMap: Record<string, import("@/lib/content/user-media-state").UserMediaState> =
    {};
  try {
    const raw = window.localStorage.getItem("muselog-user-media-state-v1");
    if (raw) {
      stateMap = JSON.parse(raw) as typeof stateMap;
    }
  } catch {
    stateMap = {};
  }

  const userContentMap = Object.fromEntries(
    getAllUserContent().map((item) => [item.id, item]),
  );
  const results: Content[] = [];
  const seen = new Set<string>();

  for (const state of Object.values(stateMap)) {
    if (state.status !== "WANT") continue;
    if (inJournal.has(state.mediaKey)) continue;

    const catalog = getContentByMediaKey(state.mediaKey);
    const userItem = userContentMap[state.mediaKey];
    const type =
      catalog?.type ?? userItem?.type ?? state.mediaType ?? null;
    if (type !== contentType) continue;

    const id = state.mediaKey;
    if (seen.has(id)) continue;
    seen.add(id);

    results.push(
      userContentToWaitingItem(
        id,
        type,
        catalog?.title ?? userItem?.title ?? state.title ?? "Untitled",
        catalog?.creator ?? userItem?.creator ?? state.creator ?? "",
        catalog?.cover ?? userItem?.cover ?? state.cover ?? "from-slate-800 via-slate-900 to-black",
      ),
    );
  }

  return results;
}

export function getWaitingList(
  items: MediaItem[],
  tab: WaitingTab,
): Content[] {
  const inJournal = getJournalContentIds(items);
  const contentType = TAB_TO_CONTENT[tab];

  const catalogItems = getApiWaitingCatalog().filter(
    (entry) => entry.type === contentType && !inJournal.has(entry.id),
  );

  const userWantItems = getUserWantItems(inJournal, contentType);
  const catalogIds = new Set(catalogItems.map((item) => item.id));
  const merged = [
    ...catalogItems,
    ...userWantItems.filter((item) => !catalogIds.has(item.id)),
  ];

  return merged;
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

  const catalog = getApiWaitingCatalog();

  if (!normalized) {
    return catalog.filter((entry) => !inJournal.has(entry.id));
  }

  const userMatches = getUserWantItems(inJournal, "BOOK")
    .concat(getUserWantItems(inJournal, "MOVIE"))
    .concat(getUserWantItems(inJournal, "MUSIC"))
    .filter((entry) => {
      if (inJournal.has(entry.id)) return false;
      if (entry.title.toLowerCase().includes(normalized)) return true;
      if (entry.creator.toLowerCase().includes(normalized)) return true;
      return false;
    });

  const seen = new Set<string>();
  return catalog
    .filter((entry) => {
      if (inJournal.has(entry.id)) return false;
      if (entry.title.toLowerCase().includes(normalized)) return true;
      if (entry.creator.toLowerCase().includes(normalized)) return true;
      return entry.tags.some((tag) => tag.toLowerCase().includes(normalized));
    })
    .concat(userMatches)
    .filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
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
