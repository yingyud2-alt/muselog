import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { CONTENT_CATALOG, getContentById } from "@/lib/content/content-data";
import type { Memory } from "@/lib/content/types";
import type { UserMediaState } from "@/lib/content/user-media-state";
import { buildLibraryItems } from "@/lib/library/library-items";
import {
  contentToWork,
  libraryItemToWork,
  mediaItemToWork,
  mergeWorks,
} from "@/lib/work/work-adapters";
import { getImportedWorkById, listImportedWorks } from "@/lib/work/imported-work-catalog";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import type { MediaItem } from "@/types/media";
import type { Work } from "@/types/work";

/**
 * Local Work repository — single read model over existing stores.
 * Swap internals for services/api/* when remote APIs are wired.
 */
export function listCatalogWorks(): Work[] {
  const local = CONTENT_CATALOG.map((content) => contentToWork(content));
  const imported = listImportedWorks();
  const byId = new Map<string, Work>();
  for (const work of local) byId.set(work.id, work);
  for (const work of imported) byId.set(work.id, work);
  return Array.from(byId.values());
}

export function buildWorks(
  stateMap: Record<string, UserMediaState>,
  memories: Memory[],
  journalEntries: MediaItem[],
): Work[] {
  const libraryItems = buildLibraryItems(stateMap, memories, journalEntries);

  return libraryItems.map((item) => {
    const catalog = getContentByMediaKey(item.mediaKey);
    const imported = getImportedWorkById(item.mediaKey);
    const base = libraryItemToWork(item);

    if (imported) {
      return mergeWorks(imported, {
        userStatus: base.userStatus,
        userState: base.userStatus,
        rating: base.rating,
        review: base.review,
        droppedReason: base.droppedReason,
        timeline: base.timeline,
        userNotes: base.userNotes,
        description: base.description || imported.description,
      });
    }

    if (!catalog) return base;

    return mergeWorks(contentToWork(catalog), {
      id: base.id,
      type: base.type,
      title: base.title,
      creator: base.creator,
      coverUrl: base.coverUrl,
      userStatus: base.userStatus,
      userState: base.userStatus,
      rating: base.rating,
      review: base.review,
      droppedReason: base.droppedReason,
      timeline: base.timeline,
      userNotes: base.userNotes,
      description: base.description || catalog.description,
      genres: catalog.tags,
      moodTags:
        base.moodTags.length > 0 ? base.moodTags : catalog.tags.slice(0, 4),
    });
  });
}

export function getWorkById(
  id: string,
  stateMap: Record<string, UserMediaState>,
  memories: Memory[],
  journalEntries: MediaItem[],
): Work | null {
  const resolved = resolveWorkRouteId(id);
  const works = buildWorks(stateMap, memories, journalEntries);
  const owned = works.find((work) => work.id === resolved);
  if (owned) return owned;

  const imported = getImportedWorkById(resolved);
  if (imported) return imported;

  const catalog = getContentById(resolved) ?? getContentByMediaKey(resolved);
  if (catalog) return contentToWork(catalog);

  const journal = journalEntries.find((entry) => {
    const key = entry.id.replace(/^journal-/, "");
    return key === resolved || entry.id === resolved;
  });
  if (journal) return mediaItemToWork(journal);

  return null;
}

export function listWorksByType(
  works: Work[],
  type: Work["type"] | "all",
): Work[] {
  if (type === "all") return works;
  return works.filter((work) => work.type === type);
}

export function listWorksByUserState(
  works: Work[],
  state: Work["userStatus"] | "all",
): Work[] {
  if (state === "all") return works;
  return works.filter((work) => work.userStatus === state);
}
