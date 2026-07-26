"use client";

import { useCallback, useMemo } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
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

type UseLibraryItemsOptions = {
  query?: string;
  typeFilter?: LibraryTypeFilter;
  statusFilter?: LibraryStatusFilter;
  sort?: LibrarySort;
};

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

  return { items, allItems, stats, getItemByKey };
}
