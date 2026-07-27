"use client";

import { useEffect, useMemo } from "react";

import { CategoryExplorer } from "@/components/explore/category-explorer";
import { ContentCard } from "@/components/explore/content-card";
import { SearchBar } from "@/components/explore/search-bar";
import {
  contentMatchesExploreMood,
  EXPLORE_MOODS,
} from "@/lib/content/constants";
import { toExploreDataLog } from "@/lib/explore/explore-content-provider";
import { useExploreContentCatalog } from "@/lib/explore/explore-public-catalog";
import { useExploreUiState } from "@/lib/explore/explore-ui-state";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

export function MobileExplore() {
  const { exploreMood, setExploreMood } = useExploreUiState();
  const catalog = useExploreContentCatalog();

  const items = useMemo(() => {
    const filtered = catalog.filter((item) =>
      contentMatchesExploreMood(item.tags, exploreMood),
    );
    // API-first: avoid empty mood grids when subjects don't map to mock tags.
    return filtered.length > 0 ? filtered : catalog;
  }, [catalog, exploreMood]);

  useEffect(() => {
    // Temporary runtime verification — Open Library vs mock.
    // eslint-disable-next-line no-console
    console.log("EXPLORE DATA", toExploreDataLog(items));
  }, [items]);

  return (
    <div
      className="min-h-[100svh] px-5 pt-[calc(env(safe-area-inset-top)+20px)]"
      style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
    >
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          Explore
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/92">
          For your mood
        </h1>
        <p className="mt-2 text-sm text-white/48">
          Recommendations shaped by feeling, not popularity.
        </p>
      </header>

      <SearchBar className="mb-6" />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXPLORE_MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => setExploreMood(mood.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              exploreMood === mood.id
                ? "border-white/25 bg-white/12 text-white"
                : "border-white/10 bg-white/[0.03] text-white/50",
            )}
          >
            {mood.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>

      <div className="mt-12 border-t border-white/[0.06] pt-8">
        <CategoryExplorer />
      </div>
    </div>
  );
}
