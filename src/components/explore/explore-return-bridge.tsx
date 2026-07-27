"use client";

import { useCallback, useMemo } from "react";

import { useReturnSnapshot } from "@/hooks/use-return-snapshot";
import { useMediaSearch } from "@/hooks/use-media-search";
import type { ExploreMood } from "@/lib/content/constants";
import type { DiscoveryCategory } from "@/lib/content/explore-discovery";
import type { ContentType } from "@/lib/content/types";
import { useExploreUiState } from "@/lib/explore/explore-ui-state";
import type { ReturnContext } from "@/lib/navigation/return-context";

const VALID_MOODS = new Set<ExploreMood>(["quiet", "nostalgic", "curious"]);
const VALID_TYPES = new Set<"all" | ContentType>([
  "all",
  "BOOK",
  "MOVIE",
  "MUSIC",
]);
const VALID_CATEGORIES = new Set<DiscoveryCategory>(["book", "film", "music"]);

/**
 * Registers Explore UI + scroll for ReturnContext while Work Detail is open.
 * Mount once on the Explore page (mobile + desktop).
 */
export function ExploreReturnBridge() {
  const {
    exploreMood,
    typeFilter,
    category,
    patchExploreUi,
  } = useExploreUiState();
  const { query: searchQuery, setQuery } = useMediaSearch();

  const restoreExploreUi = useCallback(
    (context: ReturnContext) => {
      const explore = context.pageState?.explore;
      if (!explore) return;

      const nextMood = explore.exploreMood as ExploreMood | undefined;
      const nextType = explore.typeFilter as ("all" | ContentType) | undefined;
      const nextCategory = explore.category as DiscoveryCategory | undefined;

      const patch: {
        exploreMood?: ExploreMood;
        typeFilter?: "all" | ContentType;
        category?: DiscoveryCategory;
      } = {};

      if (nextMood && VALID_MOODS.has(nextMood) && nextMood !== exploreMood) {
        patch.exploreMood = nextMood;
      }
      if (nextType && VALID_TYPES.has(nextType) && nextType !== typeFilter) {
        patch.typeFilter = nextType;
      }
      if (
        nextCategory &&
        VALID_CATEGORIES.has(nextCategory) &&
        nextCategory !== category
      ) {
        patch.category = nextCategory;
      }

      if (Object.keys(patch).length > 0) {
        patchExploreUi(patch);
      }

      if (
        typeof explore.searchQuery === "string" &&
        explore.searchQuery !== searchQuery
      ) {
        setQuery(explore.searchQuery);
      }
    },
    [
      category,
      exploreMood,
      patchExploreUi,
      searchQuery,
      setQuery,
      typeFilter,
    ],
  );

  const exploreSnapshot = useMemo(
    () => ({
      explore: {
        exploreMood,
        typeFilter,
        category,
        searchQuery,
      },
    }),
    [exploreMood, typeFilter, category, searchQuery],
  );

  useReturnSnapshot(exploreSnapshot, restoreExploreUi);

  return null;
}
