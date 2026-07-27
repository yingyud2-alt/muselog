"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useAllMemories } from "@/lib/content/memory-store";
import { useUserContentMap } from "@/lib/content/user-content-store";
import {
  persistSearchQuery,
  readPersistedSearchQuery,
  searchMedia,
  workToMediaSearchResult,
  type MediaSearchResult,
} from "@/lib/content/search";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { isRemoteCoverUrl } from "@/lib/work/cover-url";
import { persistImportedWork } from "@/lib/work/imported-work-catalog";
import { workIdentityKey } from "@/lib/work/work-identity";
import type { Work } from "@/types/work";

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

async function fetchOpenLibraryBooks(query: string): Promise<Work[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "8",
  });
  const response = await fetch(`/api/books/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Work[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

/**
 * Duplicate identity preference:
 * 1. Real remote coverUrl
 * 2. Imported API Work (open_library)
 * 3. User library/memory
 * 4. Local catalog/mock
 */
function searchResultPreference(item: MediaSearchResult): number {
  let score = 0;
  if (isRemoteCoverUrl(item.coverUrl)) score += 100;
  if (item.source === "open_library") score += 50;
  else if (item.source === "library") score += 20;
  else if (item.source === "memory") score += 10;
  return score;
}

function pickPreferredResult(
  current: MediaSearchResult,
  candidate: MediaSearchResult,
): MediaSearchResult {
  // Always prefer Open Library over catalog when identity matches.
  if (
    candidate.source === "open_library" &&
    current.source === "catalog"
  ) {
    return candidate;
  }
  if (
    current.source === "open_library" &&
    candidate.source === "catalog"
  ) {
    return current;
  }

  return searchResultPreference(candidate) > searchResultPreference(current)
    ? candidate
    : current;
}

/**
 * Merge local + remote search hits.
 * Identity key = normalized title + normalized creator (accents stripped).
 * Matching Open Library results replace catalog duplicates.
 */
export function mergeMediaSearchResults(
  local: MediaSearchResult[],
  remote: MediaSearchResult[],
): MediaSearchResult[] {
  if (remote.length === 0) return local;

  const byKey = new Map<string, MediaSearchResult>();
  const order: string[] = [];

  for (const item of [...local, ...remote]) {
    const key = workIdentityKey(item.title, item.creator);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      order.push(key);
      continue;
    }
    byKey.set(key, pickPreferredResult(existing, item));
  }

  // Deduplicate by id after preference (same Work may appear once).
  const seenIds = new Set<string>();
  const merged: MediaSearchResult[] = [];
  for (const key of order) {
    const item = byKey.get(key);
    if (!item || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    merged.push(item);
  }
  return merged;
}

export function useMediaSearch() {
  const { allItems } = useLibraryItems();
  const { memories } = useAllMemories();
  const userContentMap = useUserContentMap();
  const [remoteBooks, setRemoteBooks] = useState<MediaSearchResult[]>([]);
  const [remoteQuery, setRemoteQuery] = useState("");

  const query = useSyncExternalStore(
    subscribeSearchQuery,
    getSearchQuerySnapshot,
    () => "",
  );

  const setQuery = useCallback((value: string) => {
    persistSearchQuery(value);
    window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const works = await fetchOpenLibraryBooks(trimmed);
          if (cancelled) return;

          // Persist identity only — no user status / rating / journal writes.
          for (const work of works) {
            persistImportedWork(work);
          }

          setRemoteBooks(works.map((work) => workToMediaSearchResult(work)));
          setRemoteQuery(trimmed);
        } catch {
          if (cancelled) return;
          setRemoteBooks([]);
          setRemoteQuery(trimmed);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo(() => {
    const local = searchMedia(query, {
      libraryItems: allItems,
      memories,
      userContentById: userContentMap,
    });

    const trimmed = query.trim();
    const activeRemote =
      trimmed.length >= 2 && remoteQuery === trimmed ? remoteBooks : [];

    return mergeMediaSearchResults(local, activeRemote);
  }, [allItems, memories, query, remoteBooks, remoteQuery, userContentMap]);

  return {
    query,
    setQuery,
    results,
  };
}
