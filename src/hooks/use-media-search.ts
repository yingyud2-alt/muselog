"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { useAllMemories } from "@/lib/content/memory-store";
import { useUserContentMap } from "@/lib/content/user-content-store";
import {
  persistSearchQuery,
  readPersistedSearchQuery,
  searchMedia,
} from "@/lib/content/search";
import { useLibraryItems } from "@/lib/library/use-library-items";

export const MEDIA_SEARCH_UPDATED_EVENT = "muselog-search-updated";
const SEARCH_EVENT = MEDIA_SEARCH_UPDATED_EVENT;

function subscribeSearchQuery(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener(SEARCH_EVENT, handler);

  return () => {
    window.removeEventListener(SEARCH_EVENT, handler);
  };
}

function getSearchQuerySnapshot() {
  return readPersistedSearchQuery();
}

export function useMediaSearch() {
  const { allItems } = useLibraryItems();
  const { memories } = useAllMemories();
  const userContentMap = useUserContentMap();

  const query = useSyncExternalStore(
    subscribeSearchQuery,
    getSearchQuerySnapshot,
    () => "",
  );

  const setQuery = useCallback((value: string) => {
    persistSearchQuery(value);
    window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
  }, []);

  const results = useMemo(() => {
    return searchMedia(query, {
      libraryItems: allItems,
      memories,
      userContentById: userContentMap,
    });
  }, [allItems, memories, query, userContentMap]);

  return {
    query,
    setQuery,
    results,
  };
}
