"use client";

import { useMemo, useState } from "react";

import { ContentCard } from "@/components/explore/content-card";
import { CuratedListCard } from "@/components/explore/curated-list-card";
import { CONTENT_CATALOG } from "@/lib/content/content-data";
import {
  contentMatchesExploreMood,
  EXPLORE_MOODS,
  type ExploreMood,
} from "@/lib/content/constants";
import { CURATED_LISTS } from "@/lib/content/curated-lists";
import { useAllMemories } from "@/lib/content/memory-store";
import type { ContentType } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: Array<{ value: "all" | ContentType; label: string }> = [
  { value: "all", label: "All" },
  { value: "BOOK", label: "Books" },
  { value: "MOVIE", label: "Movies" },
  { value: "MUSIC", label: "Music" },
];

export function ExploreCatalog() {
  const [exploreMood, setExploreMood] = useState<ExploreMood>("quiet");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const { memories } = useAllMemories();

  const savedIds = useMemo(
    () => new Set(memories.map((memory) => memory.contentId)),
    [memories],
  );

  const items = useMemo(() => {
    return CONTENT_CATALOG.filter((item) => {
      const matchesMood = contentMatchesExploreMood(item.tags, exploreMood);
      const matchesType =
        typeFilter === "all" ? true : item.type === typeFilter;

      return matchesMood && matchesType;
    });
  }, [exploreMood, typeFilter]);

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
          {CURATED_LISTS.map((list) => (
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
          <p className="text-sm text-white/45">
            No works match this mood yet. Try another feeling.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
