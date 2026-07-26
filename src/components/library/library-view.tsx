"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { LibraryCard } from "@/components/library/library-card";
import { LibraryDetail } from "@/components/library/library-detail";
import {
  LibraryEmptyState,
  LibraryFilters,
} from "@/components/library/library-empty-state";
import { useLibraryItems } from "@/lib/library/use-library-items";
import type {
  LibraryItem,
  LibrarySort,
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ id: LibrarySort; label: string }> = [
  { id: "recently-updated", label: "Recently Updated" },
  { id: "recently-added", label: "Recently Added" },
  { id: "title", label: "Title" },
  { id: "highest-rated", label: "Highest Rated" },
];

export function LibraryView() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>("all");
  const [sort, setSort] = useState<LibrarySort>("recently-updated");
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  const { items, stats } = useLibraryItems({
    query,
    typeFilter,
    statusFilter,
    sort,
  });

  const summary = useMemo(() => {
    return `${stats.total} saved · ${stats.ongoing} in progress · ${stats.finished} finished`;
  }, [stats]);

  const mobileSummary = useMemo(() => {
    return `${stats.total} saved · ${stats.ongoing} in progress`;
  }, [stats]);

  return (
    <>
      <div
        className="mx-auto max-w-6xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        <header className="mb-6 max-w-3xl md:mb-8">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 md:text-[11px]">
            Library
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/92 md:mt-2 md:text-3xl">
            Your personal collection
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/48">
            Books, films, and music you&apos;ve saved — want lists, journeys,
            and finished favorites in one place.
          </p>
          <p className="mt-3 text-[13px] text-white/42 md:text-sm">
            <span className="md:hidden">{mobileSummary}</span>
            <span className="hidden md:inline">{summary}</span>
          </p>
        </header>

        <div className="relative mb-4 max-w-2xl">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your library..."
            aria-label="Search your library"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white/85 placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
          />
        </div>

        <LibraryFilters
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          className="mb-4"
        />

        <div className="mb-5 hidden max-w-xs md:block">
          <label className="sr-only" htmlFor="library-sort">
            Sort library
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as LibrarySort)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#121820]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 md:hidden">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as LibrarySort)}
            aria-label="Sort library"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#121820]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {items.length === 0 ? (
          <LibraryEmptyState
            query={query}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
          />
        ) : (
          <div
            className={cn(
              "grid grid-cols-2 gap-3 sm:gap-4",
              "md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            )}
          >
            {items.map((item) => (
              <LibraryCard
                key={item.mediaKey}
                item={item}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      <LibraryDetail item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
