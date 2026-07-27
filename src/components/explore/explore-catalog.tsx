"use client";

import { useEffect, useMemo } from "react";

import { ContentCard } from "@/components/explore/content-card";
import { CuratedListCard } from "@/components/explore/curated-list-card";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import {
  contentMatchesExploreMood,
  EXPLORE_MOODS,
} from "@/lib/content/constants";
import { useAllMemories } from "@/lib/content/memory-store";
import type { ContentType } from "@/lib/content/types";
import {
  useExploreContentCatalog,
  useExploreCuratedLists,
} from "@/lib/explore/explore-public-catalog";
import { toExploreDataLog } from "@/lib/explore/explore-content-provider";
import { useExploreUiState } from "@/lib/explore/explore-ui-state";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: Array<{ value: "all" | ContentType; label: string }> = [
  { value: "all", label: "All" },
  { value: "BOOK", label: "Books" },
  { value: "MOVIE", label: "Movies" },
  { value: "MUSIC", label: "Music" },
];

export function ExploreCatalog() {
  const {
    exploreMood,
    typeFilter,
    setExploreMood,
    setTypeFilter,
  } = useExploreUiState();
  const { memories } = useAllMemories();
  const catalog = useExploreContentCatalog();
  const curatedLists = useExploreCuratedLists();

  const savedIds = useMemo(
    () => new Set(memories.map((memory) => memory.contentId)),
    [memories],
  );

  const items = useMemo(() => {
    const filtered = catalog.filter((item) => {
      const matchesMood = contentMatchesExploreMood(item.tags, exploreMood);
      const matchesType =
        typeFilter === "all" ? true : item.type === typeFilter;

      return matchesMood && matchesType;
    });

    // API-first books may not carry mock mood tags for every hit —
    // if the mood filter empties the grid, show type-matched API works.
    if (filtered.length === 0 && catalog.length > 0) {
      return catalog.filter((item) =>
        typeFilter === "all" ? true : item.type === typeFilter,
      );
    }

    return filtered;
  }, [catalog, exploreMood, typeFilter]);

  useEffect(() => {
    // Temporary runtime verification — Open Library vs mock.
    // eslint-disable-next-line no-console
    console.log("EXPLORE DATA", toExploreDataLog(items));
  }, [items]);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/38">
          Today&apos;s mood
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPLORE_MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => setExploreMood(mood.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                exploreMood === mood.id
                  ? "border-white/30 bg-white/12 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/75",
              )}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-white/88">Recommended lists</h2>
          <p className="mt-1 text-sm text-white/42">
            Curated collections for quiet evenings and reflective moods.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {curatedLists.map((list) => (
            <CuratedListCard key={list.id} list={list} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-white/88">
              For your feeling
            </h2>
            <p className="mt-1 text-sm text-white/42">
              Works that match a {exploreMood} mood.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTypeFilter(item.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  typeFilter === item.value
                    ? "border-white/30 bg-white/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <MuseEmptyState
            title="No works match this mood yet."
            description="Try another feeling — quiet, nostalgic, or curious worlds await."
            actionLabel="Browse all moods"
            actionHref="/explore"
          />
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                isSaved={savedIds.has(content.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
