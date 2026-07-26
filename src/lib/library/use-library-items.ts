"use client";

import { useCallback, useMemo } from "react";

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
import {
  contentToWork,
  libraryItemToWork,
  mergeWorks,
} from "@/lib/work/work-adapters";

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

  const allItems = useMemo(
    () => buildLibraryItems(stateMap, memories, journalEntries),
    [stateMap, memories, journalEntries],
  );

  const allWorks = useMemo(
    () =>
      allItems.map((item) => {
        const catalog = getContentByMediaKey(item.mediaKey);
        const fromLibrary = libraryItemToWork(item);
        if (!catalog) return fromLibrary;
        return mergeWorks(contentToWork(catalog), {
          ...fromLibrary,
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
    (mediaKey: string) =>
      allItems.find((item) => item.mediaKey === mediaKey) ?? null,
    [allItems],
  );

  return { items, allItems, allWorks, stats, getItemByKey };
}
