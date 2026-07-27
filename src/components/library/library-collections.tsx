"use client";

import { useMemo } from "react";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import {
  buildFeaturedCollections,
  type FeaturedCollection,
} from "@/lib/library/library-featured-collections";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type LibraryCollectionsProps = {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  /** @deprecated Prefer `items` — kept for transitional call sites. */
  books?: LibraryItem[];
  movies?: LibraryItem[];
  music?: LibraryItem[];
};

function CollectionCollage({
  collection,
  onSelect,
}: {
  collection: FeaturedCollection;
  onSelect: (item: LibraryItem) => void;
}) {
  const previews = collection.items.slice(0, 4);

  if (previews.length === 0) {
    return (
      <div className="flex h-[88px] w-full items-center justify-center rounded-[12px] border border-dashed border-white/[0.08] bg-white/[0.02]">
        <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/22">
          Empty shelf
        </span>
      </div>
    );
  }

  return (
    <ul className="relative flex h-[96px] items-end">
      {previews.map((item, index) => (
        <li
          key={item.mediaKey}
          className="absolute bottom-0"
          style={{
            left: `${index * 28}px`,
            zIndex: previews.length - index,
            width: 64,
          }}
        >
          <button
            type="button"
            onClick={() => onSelect(item)}
            aria-label={`Open ${item.title}`}
            className={cn(
              "block w-full overflow-hidden rounded-[8px] ring-1 ring-black/40",
              "transition-transform duration-300 hover:-translate-y-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
            )}
          >
            <LibraryArchiveCover
              cover={item.cover}
              title={item.title}
              className="rounded-[8px]"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Featured thematic collections — cover collage, title, work count.
 * Examples: Quiet Nights · Human Stories · Slow Cinema
 */
export function LibraryCollections({
  items,
  books,
  movies,
  music,
  onSelect,
}: LibraryCollectionsProps) {
  const pool = useMemo(() => {
    if (items?.length) return items;
    return [...(books ?? []), ...(movies ?? []), ...(music ?? [])];
  }, [items, books, movies, music]);

  const collections = useMemo(
    () => buildFeaturedCollections(pool),
    [pool],
  );

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Collections
        </h2>
        <p className="text-sm text-white/40">
          Featured shelves drawn from the moods in your archive
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {collections.map((collection) => {
          const count = collection.items.length;

          return (
            <article
              key={collection.id}
              className={cn(
                "flex flex-col border border-white/[0.07] bg-[#0E141C] px-4 py-4",
                "rounded-[18px]",
              )}
            >
              <div className="min-h-[96px]">
                <CollectionCollage
                  collection={collection}
                  onSelect={onSelect}
                />
              </div>

              <h3 className="mt-4 font-display text-[18px] font-semibold tracking-tight text-white/90">
                {collection.title}
              </h3>
              <p className="mt-2 font-label text-[11px] uppercase tracking-[0.14em] text-white/30">
                {count} {count === 1 ? "work" : "works"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
