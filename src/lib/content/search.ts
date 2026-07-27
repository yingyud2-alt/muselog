import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Memory } from "@/lib/content/types";
import type { Content, ContentType } from "@/lib/content/types";
import type { UserContentItem } from "@/lib/content/user-content-store";
import type { LibraryItem } from "@/lib/library/library-types";

/**
 * Local + remote media search.
 * Priority when merging (see use-media-search):
 *   API open_library > user library/memory > mock CONTENT_CATALOG fallback.
 */

export type MediaSearchMatchField = "title" | "creator" | "tag" | "note";

export type MediaSearchSource =
  | "catalog"
  | "library"
  | "memory"
  | "open_library";

export type MediaSearchResult = {
  id: string;
  title: string;
  creator: string;
  type: ContentType;
  source: MediaSearchSource;
  matchField: MediaSearchMatchField;
  href: string;
  meta: string;
  /** Optional cover for API / catalog rows (UI may ignore). */
  coverUrl?: string;
};

/** @deprecated Use MediaSearchResult */
export type SearchResult = Content & {
  matchField: "title" | "creator" | "tag";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function resolveHref(contentId: string | null, mediaKey: string): string {
  if (contentId && CONTENT_CATALOG.some((entry) => entry.id === contentId)) {
    return `/explore/${contentId}`;
  }

  if (mediaKey && CONTENT_CATALOG.some((entry) => entry.id === mediaKey)) {
    return `/explore/${mediaKey}`;
  }

  return "/library";
}

function resolveType(item: LibraryItem): ContentType {
  return item.type;
}

function resolveContentMeta(type: ContentType, creator: string): string {
  const role =
    type === "BOOK" ? "Author" : type === "MOVIE" ? "Director" : "Artist";

  return `${role}: ${creator} · ${CONTENT_TYPE_LABELS[type]}`;
}

function matchText(
  value: string | undefined,
  normalized: string,
): boolean {
  return Boolean(value && normalize(value).includes(normalized));
}

function matchLibraryItem(
  item: LibraryItem,
  normalized: string,
): MediaSearchMatchField | null {
  if (matchText(item.title, normalized)) return "title";
  if (matchText(item.creator, normalized)) return "creator";
  if (matchText(item.shortReview, normalized)) return "note";
  if (matchText(item.notes, normalized)) return "note";
  return null;
}

function matchContent(
  content: Content,
  normalized: string,
): "title" | "creator" | "tag" | null {
  if (matchText(content.title, normalized)) return "title";
  if (matchText(content.creator, normalized)) return "creator";
  if (content.tags.some((tag) => matchText(tag, normalized))) return "tag";
  return null;
}

function sourceLabel(source: MediaSearchSource): string {
  if (source === "library") return "Library";
  if (source === "memory") return "Saved";
  if (source === "open_library") return "Open Library";
  return "Explore";
}

/** Map an imported/API Work into the existing search result row shape. */
export function workToMediaSearchResult(work: {
  id: string;
  title: string;
  creator: string;
  coverUrl?: string;
}): MediaSearchResult {
  return {
    id: work.id,
    title: work.title,
    creator: work.creator,
    type: "BOOK",
    source: "open_library",
    matchField: "title",
    href: `/work/${work.id}`,
    meta: `${sourceLabel("open_library")} · ${resolveContentMeta("BOOK", work.creator)}`,
    // Preserve Open Library cover URL through Explore → modal snapshot.
    coverUrl: work.coverUrl,
  };
}

export function searchContentCatalog(query: string): SearchResult[] {
  const normalized = normalize(query);

  if (!normalized) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const item of CONTENT_CATALOG) {
    const matchField = matchContent(item, normalized);
    if (matchField) {
      results.push({ ...item, matchField });
    }
  }

  return results;
}

export type MediaSearchInput = {
  libraryItems?: LibraryItem[];
  memories?: Memory[];
  userContentById?: Record<string, UserContentItem>;
};

export function searchMedia(
  query: string,
  input: MediaSearchInput = {},
): MediaSearchResult[] {
  const normalized = normalize(query);

  if (!normalized) {
    return [];
  }

  const libraryItems = input.libraryItems ?? [];
  const memories = input.memories ?? [];
  const userContentById = input.userContentById ?? {};
  const seen = new Set<string>();
  const results: MediaSearchResult[] = [];

  for (const item of libraryItems) {
    const matchField = matchLibraryItem(item, normalized);
    if (!matchField) continue;

    const dedupeKey = item.contentId ?? item.mediaKey;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    results.push({
      id: dedupeKey,
      title: item.title,
      creator: item.creator,
      type: resolveType(item),
      source: "library",
      matchField,
      href: resolveHref(item.contentId, item.mediaKey),
      meta: `${sourceLabel("library")} · ${resolveContentMeta(resolveType(item), item.creator)}`,
      coverUrl: item.cover,
    });
  }

  for (const memory of memories) {
    const catalog = getContentByMediaKey(memory.contentId);
    const userContent = userContentById[memory.contentId];

    const title = catalog?.title ?? userContent?.title;
    const creator = catalog?.creator ?? userContent?.creator ?? "";
    const type = catalog?.type ?? userContent?.type;

    if (!title || !type) continue;

    let matchField: MediaSearchMatchField | null = null;

    if (catalog) {
      matchField = matchContent(catalog, normalized);
    } else {
      if (matchText(title, normalized)) matchField = "title";
      else if (matchText(creator, normalized)) matchField = "creator";
    }

    if (!matchField) continue;

    const dedupeKey = memory.contentId;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    results.push({
      id: dedupeKey,
      title,
      creator,
      type,
      source: "memory",
      matchField,
      href: resolveHref(catalog?.id ?? null, memory.contentId),
      meta: `${sourceLabel("memory")} · ${resolveContentMeta(type, creator)}`,
      coverUrl: catalog?.cover ?? userContent?.cover,
    });
  }

  for (const item of CONTENT_CATALOG) {
    if (seen.has(item.id)) continue;

    const matchField = matchContent(item, normalized);
    if (!matchField) continue;

    seen.add(item.id);
    // Mock catalog tier — lowest priority; API imports overlay in use-media-search.
    results.push({
      id: item.id,
      title: item.title,
      creator: item.creator,
      type: item.type,
      source: "catalog",
      matchField,
      href: `/explore/${item.id}`,
      meta: `${sourceLabel("catalog")} · ${resolveContentMeta(item.type, item.creator)}`,
      coverUrl: item.cover,
    });
  }

  return results;
}

export function formatSearchResultMeta(content: Content): string {
  return resolveContentMeta(content.type, content.creator);
}

export const MEDIA_SEARCH_QUERY_KEY = "muselog-media-search-query";

export function readPersistedSearchQuery(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(MEDIA_SEARCH_QUERY_KEY) ?? "";
}

export function persistSearchQuery(query: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(MEDIA_SEARCH_QUERY_KEY, query);
}

export function buildExploreSearchHref(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "/explore";
  return `/explore?q=${encodeURIComponent(trimmed)}`;
}
