import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { CONTENT_CATALOG, getContentById } from "@/lib/content/content-data";
import type { Memory } from "@/lib/content/types";
import type { UserMediaState } from "@/lib/content/user-media-state";
import { buildLibraryItems } from "@/lib/library/library-items";
import { resolveCoverUrl, isRemoteCoverUrl } from "@/lib/work/cover-url";
import {
  getImportedWorkById,
  listImportedWorks,
} from "@/lib/work/imported-work-catalog";
import {
  contentToWork,
  libraryItemToWork,
  mediaItemToWork,
  mergeWorks,
} from "@/lib/work/work-adapters";
import {
  workIdentityKey,
  workTitleIdentityKey,
} from "@/lib/work/work-identity";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import type { MediaItem } from "@/types/media";
import type { Work } from "@/types/work";

/**
 * Local Work repository — single read model over existing stores.
 *
 * Public catalog priority: API imports > mock CONTENT_CATALOG fallback.
 * User Library (status/rating/journal) stays in buildWorks from user stores.
 */

/** Public discovery Works: API imports first; mock only fills missing titles. */
export function listCatalogWorks(): Work[] {
  const byTitle = new Map<string, Work>();

  const preferApi = (candidate: Work, existing: Work | undefined): Work => {
    if (!existing) return candidate;
    const score = (work: Work) =>
      (work.source === "open_library" ? 50 : 0) +
      (isRemoteCoverUrl(work.coverUrl) ? 40 : 0) +
      (work.description.trim() ? 10 : 0);
    return score(candidate) >= score(existing) ? candidate : existing;
  };

  // 1. API imports — primary public catalog (title key collapses EN/JA authors)
  for (const work of listImportedWorks()) {
    const key = workTitleIdentityKey(work.title) || workIdentityKey(work.title, work.creator);
    byTitle.set(key, preferApi(work, byTitle.get(key)));
  }

  // 2. Mock catalog — only when no API twin exists for that title
  for (const content of CONTENT_CATALOG) {
    const work = contentToWork(content);
    const key = workTitleIdentityKey(work.title) || workIdentityKey(work.title, work.creator);
    if (!byTitle.has(key)) {
      byTitle.set(key, work);
    }
  }

  return Array.from(byTitle.values());
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
        // Keep user-library media key when it differs from API id
        id: base.id,
        userStatus: base.userStatus,
        userState: base.userStatus,
        rating: base.rating,
        review: base.review,
        droppedReason: base.droppedReason,
        timeline: base.timeline,
        userNotes: base.userNotes,
        description: base.description || imported.description,
        coverUrl: resolveCoverUrl(imported.coverUrl, base.coverUrl),
        source: imported.source,
        externalId: imported.externalId,
        metadata: imported.metadata,
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
  const catalogEntry =
    getContentById(resolved) ?? getContentByMediaKey(resolved);

  // API import wins entirely — never fall back to mock fields when present.
  if (imported) {
    if (!catalogEntry || imported.id === resolved) {
      return imported;
    }

    // Request used a mock catalog id; keep that id for library key continuity
    // while serving Open Library cover / description / metadata / ratings.
    return {
      ...imported,
      id: resolved,
    };
  }

  if (catalogEntry) return contentToWork(catalogEntry);

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
