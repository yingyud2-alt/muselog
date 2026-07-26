import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  getContentByMediaKey,
  mediaKeyFromJournalItemId,
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { CONTENT_CATALOG, getContentById } from "@/lib/content/content-data";
import type { LibraryItem } from "@/lib/library/library-types";
import { MEDIA_EXPLORE_IDS, type MediaItem } from "@/types/media";

function titleSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolve a /work/[id] param to a catalog / media key.
 * Supports full ids (`book-kafka-on-the-shore`) and short slugs (`kafka-on-the-shore`).
 */
export function resolveWorkRouteId(rawId: string): string {
  const id = decodeURIComponent(rawId).trim();
  if (!id) return id;

  if (getContentById(id) || getContentByMediaKey(id)) {
    return id;
  }

  const bySuffix = CONTENT_CATALOG.find(
    (content) =>
      content.id.endsWith(`-${id}`) ||
      content.id.replace(/^(book|movie|music)-/, "") === id,
  );
  if (bySuffix) return bySuffix.id;

  const byTitle = CONTENT_CATALOG.find(
    (content) => titleSlug(content.title) === id.toLowerCase(),
  );
  if (byTitle) return byTitle.id;

  return id;
}

export function workHrefForLibraryItem(item: LibraryItem): string {
  return `/work/${item.mediaKey}`;
}

export function workHrefForJournalItem(item: MediaItem): string | null {
  const mapped = MEDIA_EXPLORE_IDS[item.id];
  if (mapped) return `/work/${mapped}`;

  if (item.id.startsWith("journal-")) {
    return `/work/${mediaKeyFromJournalItemId(item.id)}`;
  }

  const match = CONTENT_CATALOG.find(
    (content) => content.title.toLowerCase() === item.title.toLowerCase(),
  );
  return match ? `/work/${match.id}` : null;
}

export function workHrefForBubble(work: WorkBubble): string {
  return `/work/${resolveBubbleMediaKey(work)}`;
}

export function workHrefForRecommendationId(id: string): string {
  return `/work/${id}`;
}
