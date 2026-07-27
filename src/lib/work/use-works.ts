"use client";

import { useCallback, useMemo } from "react";

import { useJournalEntries } from "@/lib/calendar/journal-store";
import { useAllMemories } from "@/lib/content/memory-store";
import { useUserMediaStateMap } from "@/lib/content/user-media-state";
import {
  buildWorks,
  getWorkById,
  listCatalogWorks,
} from "@/lib/work/work-repository";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import { workToLibraryItem } from "@/lib/work/work-adapters";
import type { LibraryItem } from "@/lib/library/library-types";
import type { Work, WorkType, WorkUserStatus } from "@/types/work";

type UseWorksOptions = {
  type?: WorkType | "all";
  userStatus?: WorkUserStatus | "all";
  /** @deprecated Use userStatus */
  userState?: WorkUserStatus | "all";
};

/**
 * Canonical Work hook for Home / Library / Journal / Profile / Detail.
 * UI may still receive LibraryItem via adapters — one source of truth.
 */
export function useWorks(options: UseWorksOptions = {}) {
  const {
    type = "all",
    userStatus = options.userState ?? "all",
  } = options;
  const stateMap = useUserMediaStateMap();
  const { memories } = useAllMemories();
  const { entries: journalEntries } = useJournalEntries();
  const importedMap = useImportedWorkMap();

  const allWorks = useMemo(
    () => buildWorks(stateMap, memories, journalEntries),
    [stateMap, memories, journalEntries, importedMap],
  );

  const works = useMemo(() => {
    return allWorks.filter((work) => {
      if (type !== "all" && work.type !== type) return false;
      if (userStatus !== "all" && work.userStatus !== userStatus) return false;
      return true;
    });
  }, [allWorks, type, userStatus]);

  const catalogWorks = useMemo(
    () => listCatalogWorks(),
    [importedMap],
  );

  const getWork = useCallback(
    (id: string) => getWorkById(id, stateMap, memories, journalEntries),
    [stateMap, memories, journalEntries, importedMap],
  );

  const asLibraryItems = useMemo(
    () => works.map((work) => workToLibraryItem(work)),
    [works],
  );

  return {
    works,
    allWorks,
    catalogWorks,
    getWork,
    asLibraryItems,
  };
}

/** Resolve a Work and optional LibraryItem view for a media key / content id. */
export function useWork(id: string | null | undefined): {
  work: Work | null;
  libraryItem: LibraryItem | null;
} {
  const { getWork } = useWorks();
  const work = useMemo(
    () => (id ? getWork(id) : null),
    [getWork, id],
  );

  return {
    work,
    libraryItem: work ? workToLibraryItem(work) : null,
  };
}
