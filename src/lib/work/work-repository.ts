import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { getContentById } from "@/lib/content/content-data";
import type { Memory } from "@/lib/content/types";
import type { UserMediaState } from "@/lib/content/user-media-state";
import { buildLibraryItems } from "@/lib/library/library-items";
import {
  isRemoteCoverUrl,
  withNormalizedCoverUrl,
} from "@/lib/work/cover-url";
import { isApiBackedSource } from "@/lib/work/content-layers";
import { filterDisplayableApiWorks } from "@/lib/work/displayable-api-work";
import { listImportedWorks } from "@/lib/work/imported-work-catalog";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
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
 * Public catalog: displayable API imports only (Open Library / TMDB / Last.fm).
 * User Library (status/rating/journal) stays in buildWorks from user stores.
 */

/** Public discovery Works — displayable API imports only. */
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

  for (const work of filterDisplayableApiWorks(listImportedWorks())) {
    const key =
      workTitleIdentityKey(work.title) ||
      workIdentityKey(work.title, work.creator);
    byTitle.set(key, preferApi(work, byTitle.get(key)));
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
    const canonical = resolveCanonicalWork({
      workId: item.mediaKey,
      title: item.title,
      creator: item.creator,
      type: item.type,
    });
    const base = libraryItemToWork(item);
    const coverUrl = resolveCanonicalCoverUrl({
      workId: item.mediaKey,
      title: item.title,
      creator: item.creator,
      type: item.type,
      libraryCover: base.coverUrl,
      catalogCover: catalog?.cover,
    });

    if (canonical && isApiBackedSource(canonical.source)) {
      return mergeWorks(canonical, {
        id: canonical.id,
        userStatus: base.userStatus,
        userState: base.userStatus,
        rating: base.rating,
        review: base.review,
        droppedReason: base.droppedReason,
        timeline: base.timeline,
        userNotes: base.userNotes,
        description: base.description || canonical.description,
        coverUrl,
        source: canonical.source,
        externalId: canonical.externalId,
        metadata: canonical.metadata,
      });
    }

    if (!catalog) return withNormalizedCoverUrl({ ...base, coverUrl });

    return mergeWorks(contentToWork(catalog), {
      id: base.id,
      type: base.type,
      title: base.title,
      creator: base.creator,
      coverUrl,
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

  const catalogEntry =
    getContentById(resolved) ?? getContentByMediaKey(resolved);
  const canonical = resolveCanonicalWork({
    workId: resolved,
    title: catalogEntry?.title,
    creator: catalogEntry?.creator,
    type: catalogEntry?.type,
  });

  // API import wins — return canonical API id when available.
  if (canonical && isApiBackedSource(canonical.source)) {
    return withNormalizedCoverUrl(canonical);
  }

  if (catalogEntry) return contentToWork(catalogEntry);

  const journal = journalEntries.find((entry) => {
    const key = entry.id.replace(/^journal-/, "");
    return key === resolved || entry.id === resolved;
  });
  if (journal) {
    const journalCanonical = resolveCanonicalWork({
      workId: resolved,
      title: journal.title,
      creator: journal.creator,
      type: journal.type,
    });
    if (journalCanonical && isApiBackedSource(journalCanonical.source)) {
      return mergeWorks(journalCanonical, {
        ...mediaItemToWork(journal),
        id: journalCanonical.id,
        coverUrl: resolveCanonicalCoverUrl({
          workId: journalCanonical.id,
          title: journal.title,
          creator: journal.creator,
          type: journal.type,
          journalCover: journal.cover,
        }),
      });
    }
    return mediaItemToWork(journal);
  }

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
