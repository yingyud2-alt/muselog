"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { useAllMemories } from "@/lib/content/memory-store";
import { useUserMediaStateMap } from "@/lib/content/user-media-state";
import {
  buildLibraryItems,
  computeLibraryStats,
  filterLibraryItems,
  sortLibraryItems,
} from "@/lib/library/library-items";
import type {
  LibrarySort,
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";
import { migrateCanonicalWorkIds } from "@/lib/work/migrate-canonical-work-ids";
import {
  logCanonicalWorkVerification,
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import {
  contentToWork,
  libraryItemToWork,
  mergeWorks,
} from "@/lib/work/work-adapters";
import { isApiBackedSource } from "@/lib/work/content-layers";

type UseLibraryItemsOptions = {
  query?: string;
  typeFilter?: LibraryTypeFilter;
  statusFilter?: LibraryStatusFilter;
  sort?: LibrarySort;
};

/**
 * Library data hook — Work is the canonical model;
 * LibraryItem remains the UI view adapted from Work + local fields.
 */
export function useLibraryItems(options: UseLibraryItemsOptions = {}) {
  const {
    query = "",
    typeFilter = "all",
    statusFilter = "all",
    sort = "recently-updated",
  } = options;

  const stateMap = useUserMediaStateMap();
  const { memories } = useAllMemories();
  const { entries: journalEntries } = useJournalEntries();
  // Re-resolve covers when Explore persists API Works.
  const importedMap = useImportedWorkMap();

  useEffect(() => {
    migrateCanonicalWorkIds();
  }, [importedMap]);

  const allItems = useMemo(
    () => buildLibraryItems(stateMap, memories, journalEntries),
    [stateMap, memories, journalEntries, importedMap],
  );

  useEffect(() => {
    logCanonicalWorkVerification(
      "library",
      allItems.map((item) => ({
        storedWorkId: item.mediaKey,
        title: item.title,
        creator: item.creator,
        type: item.type,
      })),
    );
  }, [allItems]);

  const allWorks = useMemo(
    () =>
      allItems.map((item) => {
        const catalog = getContentByMediaKey(item.mediaKey);
        const canonical = resolveCanonicalWork({
          workId: item.mediaKey,
          title: item.title,
          creator: item.creator,
          type: item.type,
        });
        const fromLibrary = libraryItemToWork(item);
        const coverUrl = resolveCanonicalCoverUrl({
          workId: item.mediaKey,
          title: item.title,
          creator: item.creator,
          type: item.type,
          libraryCover: fromLibrary.coverUrl,
          catalogCover: catalog?.cover,
        });

        if (canonical && isApiBackedSource(canonical.source)) {
          return mergeWorks(canonical, {
            ...fromLibrary,
            id: canonical.id,
            coverUrl,
            description: fromLibrary.description || canonical.description,
            source: canonical.source,
            externalId: canonical.externalId,
          });
        }

        if (!catalog) {
          return { ...fromLibrary, coverUrl };
        }

        return mergeWorks(contentToWork(catalog), {
          ...fromLibrary,
          coverUrl,
          description: fromLibrary.description || catalog.description,
          genres: catalog.tags,
          moodTags:
            fromLibrary.moodTags.length > 0
              ? fromLibrary.moodTags
              : catalog.tags.slice(0, 4),
        });
      }),
    [allItems],
  );

  const stats = useMemo(() => computeLibraryStats(allItems), [allItems]);

  const items = useMemo(() => {
    const filtered = filterLibraryItems(
      allItems,
      query,
      typeFilter,
      statusFilter,
    );
    return sortLibraryItems(filtered, sort);
  }, [allItems, query, typeFilter, statusFilter, sort]);

  const getItemByKey = useCallback(
    (mediaKey: string) => {
      const direct = allItems.find((item) => item.mediaKey === mediaKey);
      if (direct) return direct;
      const canonical = resolveCanonicalWork({ workId: mediaKey });
      if (!canonical) return null;
      return allItems.find((item) => item.mediaKey === canonical.id) ?? null;
    },
    [allItems],
  );

  return { items, allItems, allWorks, stats, getItemByKey };
}
