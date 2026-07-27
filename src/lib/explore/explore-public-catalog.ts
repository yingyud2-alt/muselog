"use client";

/**
 * Explore React adapters — UI-facing hooks over explore-content-provider.
 * Data priority (books): Open Library → other API → CONTENT_CATALOG fallback.
 */

import { useEffect, useMemo, useState } from "react";

import type { DiscoveryCategory } from "@/lib/content/explore-discovery";
import type { Content, ContentType, CuratedList } from "@/lib/content/types";
import {
  buildBookDiscoverySections,
  buildCuratedListsFromFeed,
  buildEditorialDiscoverySections,
  buildExploreContentList,
  buildMoodTagMap,
  collectApiWorks,
  getExploreApiFeedCache,
  loadExploreApiFeed,
  resolveExploreContentById,
  resolveExploreContentsByIds,
  workToExploreContent,
  type ExploreApiFeed,
  type ExploreCatalogMode,
} from "@/lib/explore/explore-content-provider";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import { useWorks } from "@/lib/work/use-works";
import { DISCOVERY_MODULE_COPY } from "@/lib/content/explore-discovery";

export type { ExploreCatalogMode };
export { workToExploreContent, DISCOVERY_MODULE_COPY };

function useExploreApiFeed() {
  const [feed, setFeed] = useState<ExploreApiFeed | null | undefined>(
    () => getExploreApiFeedCache(),
  );
  // Subscribe so cards refresh when bootstrap persists imports —
  // do NOT re-trigger feed load on every persist (avoids cancel races).
  useImportedWorkMap();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await loadExploreApiFeed();
      if (!cancelled) setFeed(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const mode: ExploreCatalogMode =
    feed === undefined
      ? "loading"
      : feed &&
          (feed.trending.length > 0 ||
            feed.popular.length > 0 ||
            Object.values(feed.byMood).some((list) => list.length > 0))
        ? "api"
        : "fallback";

  // Preserve `undefined` while loading so callers don't treat it as "no API".
  return { feed, mode };
}

export function getExploreContentById(id: string): Content | null {
  return resolveExploreContentById(id);
}

export function getExploreContentsByIds(ids: string[]): Content[] {
  return resolveExploreContentsByIds(ids);
}

export function useExploreContentCatalog(): Content[] {
  const { feed, mode } = useExploreApiFeed();
  const importedMap = useImportedWorkMap();
  const { allWorks: userLibraryWorks } = useWorks();

  return useMemo(() => {
    const importedBooks = Object.values(importedMap).filter(
      (work) => work.type === "book",
    );
    const apiWorks = collectApiWorks(feed ?? null, importedBooks);

    if (apiWorks.length > 0) {
      return buildExploreContentList(
        apiWorks,
        feed ? buildMoodTagMap(feed) : new Map(),
        userLibraryWorks,
      );
    }

    if (mode === "loading") return [];

    return buildExploreContentList(null, new Map(), userLibraryWorks);
  }, [feed, mode, importedMap, userLibraryWorks]);
}

export function useExploreCuratedLists(): CuratedList[] {
  const { feed, mode } = useExploreApiFeed();
  const importedMap = useImportedWorkMap();

  return useMemo(() => {
    const importedBooks = Object.values(importedMap).filter(
      (work) => work.type === "book",
    );
    // Prefer imported / API — never flash CONTENT_CATALOG mock while loading.
    if (mode === "loading" && importedBooks.length === 0) return [];
    return buildCuratedListsFromFeed(feed ?? null, importedBooks);
  }, [feed, mode, importedMap]);
}

export function useExploreDiscoverySections(category: DiscoveryCategory) {
  const { feed, mode } = useExploreApiFeed();
  const importedMap = useImportedWorkMap();

  return useMemo(() => {
    if (category === "book") {
      const importedBooks = Object.values(importedMap).filter(
        (work) => work.type === "book",
      );
      const sections = buildBookDiscoverySections(feed ?? null, importedBooks);
      // Books are API-only when any public catalog data exists —
      // never mix CONTENT_CATALOG / editorial mock into Trending / New Releases.
      if (sections.length > 0) return sections;
      if (mode === "loading") return [];
      return [];
    }

    // Film / music — editorial seed until TMDB / Spotify providers land.
    return buildEditorialDiscoverySections(category);
  }, [category, feed, mode, importedMap]);
}

export function useExploreCatalogMode(): ExploreCatalogMode {
  return useExploreApiFeed().mode;
}

export function filterExploreContent(
  items: Content[],
  options: {
    typeFilter?: "all" | ContentType;
    moodTags?: string[];
    matchMood?: (tags: string[]) => boolean;
  },
): Content[] {
  const { typeFilter = "all", matchMood } = options;
  return items.filter((item) => {
    const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
    const matchesMood = matchMood ? matchMood(item.tags) : true;
    return matchesType && matchesMood;
  });
}

/** Re-export build helpers used by tests / callers. */
export { buildExploreContentList } from "@/lib/explore/explore-content-provider";
