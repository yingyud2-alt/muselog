"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Upload } from "lucide-react";

import { CurrentlyExploring } from "@/components/library/currently-exploring";
import { LibraryAiCurated } from "@/components/library/library-ai-curated";
import { LibraryCollections } from "@/components/library/library-collections";
import {
  LibraryEmptyState,
  LibraryFilters,
} from "@/components/library/library-empty-state";
import { LibraryShelf } from "@/components/library/library-shelf";
import { WaitingShelf } from "@/components/library/waiting-shelf";
import { useReturnSnapshot } from "@/hooks/use-return-snapshot";
import { useMuseRecommendations } from "@/lib/ai/use-muse-recommendations";
import {
  openRecommendationDetail,
  openWorkDetail,
} from "@/lib/detail/detail-overlay-store";
import {
  getLibraryItemReason,
  sortLibraryItems,
} from "@/lib/library/library-items";
import { useLibraryItems } from "@/lib/library/use-library-items";
import type {
  LibraryItem,
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";
import type { ReturnContext } from "@/lib/navigation/return-context";
import { cn } from "@/lib/utils";

function formatArchiveStats(items: LibraryItem[]): string {
  const books = items.filter((item) => item.type === "BOOK").length;
  const movies = items.filter((item) => item.type === "MOVIE").length;
  const music = items.filter((item) => item.type === "MUSIC").length;

  const parts: string[] = [];
  if (books > 0) parts.push(`${books} ${books === 1 ? "book" : "books"}`);
  if (movies > 0) parts.push(`${movies} ${movies === 1 ? "movie" : "movies"}`);
  if (music > 0) parts.push(`${music} music`);

  if (parts.length === 0) return "Your archive is waiting to begin";
  return parts.join(" · ");
}

export function DesktopLibrary() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>("all");

  const restoreLibraryUi = useCallback((context: ReturnContext) => {
    const library = context.pageState?.library;
    if (!library) return;
    setQuery(library.query ?? "");
    setTypeFilter((library.typeFilter as LibraryTypeFilter) ?? "all");
    setStatusFilter((library.statusFilter as LibraryStatusFilter) ?? "all");
  }, []);

  const librarySnapshot = useMemo(
    () => ({
      library: {
        query,
        typeFilter,
        statusFilter,
      },
    }),
    [query, typeFilter, statusFilter],
  );

  useReturnSnapshot(librarySnapshot, restoreLibraryUi);

  const { items, allItems } = useLibraryItems({
    query,
    typeFilter,
    statusFilter,
    sort: "recently-updated",
  });
  const recommendations = useMuseRecommendations(6);

  const isFiltering =
    query.trim().length > 0 || typeFilter !== "all" || statusFilter !== "all";

  const recentlyAdded = useMemo(
    () => sortLibraryItems(allItems, "recently-added").slice(0, 12),
    [allItems],
  );

  const exploring = useMemo(
    () =>
      sortLibraryItems(
        allItems.filter((item) => item.status === "ONGOING"),
        "recently-updated",
      ).slice(0, 6),
    [allItems],
  );

  const waiting = useMemo(
    () =>
      sortLibraryItems(
        allItems.filter((item) => item.status === "WANT"),
        "recently-added",
      ),
    [allItems],
  );

  const books = useMemo(
    () =>
      sortLibraryItems(
        allItems.filter((item) => item.type === "BOOK"),
        "title",
      ),
    [allItems],
  );

  const movies = useMemo(
    () =>
      sortLibraryItems(
        allItems.filter((item) => item.type === "MOVIE"),
        "title",
      ),
    [allItems],
  );

  const music = useMemo(
    () =>
      sortLibraryItems(
        allItems.filter((item) => item.type === "MUSIC"),
        "title",
      ),
    [allItems],
  );

  const archiveLine = useMemo(
    () => formatArchiveStats(allItems),
    [allItems],
  );

  const openWork = (item: LibraryItem) => {
    openWorkDetail(item.mediaKey);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-8 py-10 pb-20">
      <header className="border-b border-white/[0.06] pb-8">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="font-display text-[34px] font-semibold tracking-tight text-white/94">
              My Library
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-white/48">
              A quiet archive of stories, sounds, and memories.
            </p>
            <p className="mt-4 text-[12px] tracking-wide text-white/30">
              {archiveLine}
            </p>
          </div>

          <Link
            href="/library/import"
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08]",
              "bg-white/[0.03] px-4 py-2 text-[13px] text-white/55",
              "transition-colors hover:bg-white/[0.06] hover:text-white/78",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
            )}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Import
          </Link>
        </div>

        <div className="relative mt-7 max-w-xl">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/28"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your collection..."
            aria-label="Search your collection"
            className={cn(
              "w-full rounded-2xl border border-white/[0.08] bg-white/[0.03]",
              "py-3 pl-10 pr-4 text-sm text-white/85 placeholder:text-white/28",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/12",
            )}
          />
        </div>

        <LibraryFilters
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          className="mt-4 opacity-80"
        />
      </header>

      {isFiltering ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-medium tracking-tight text-white/90">
              Search results
            </h2>
            <p className="text-sm text-white/40">
              {items.length} match{items.length === 1 ? "" : "es"} in your
              archive
            </p>
          </div>
          {items.length === 0 ? (
            <LibraryEmptyState
              query={query}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
            />
          ) : (
            <LibraryShelf
              items={items}
              onSelect={openWork}
              cardWidth="md"
              variant="collectible"
              showReason
              getReason={getLibraryItemReason}
            />
          )}
        </section>
      ) : (
        <>
          <LibraryShelf
            title="Recently Added"
            description="New covers settling into your archive"
            items={recentlyAdded}
            onSelect={openWork}
            cardWidth="lg"
            variant="recent"
            emptyMessage="Add or import titles to start your archive."
          />

          <CurrentlyExploring items={exploring} onSelect={openWork} />

          <LibraryAiCurated
            recommendations={recommendations}
            onSelect={openRecommendationDetail}
          />

          <WaitingShelf items={waiting} onSelect={openWork} />

          <LibraryCollections
            books={books}
            movies={movies}
            music={music}
            onSelect={openWork}
          />
        </>
      )}
    </div>
  );
}
