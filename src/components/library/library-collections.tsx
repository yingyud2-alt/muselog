"use client";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type CollectionGroup = {
  id: "BOOK" | "MOVIE" | "MUSIC";
  title: string;
  description: string;
  items: LibraryItem[];
};

type LibraryCollectionsProps = {
  books: LibraryItem[];
  movies: LibraryItem[];
  music: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
};

/**
 * Visual archive collections — finished works only.
 */
export function LibraryCollections({
  books,
  movies,
  music,
  onSelect,
}: LibraryCollectionsProps) {
  const groups: CollectionGroup[] = [
    {
      id: "BOOK",
      title: "My Reading Shelf",
      description: "Books already lived with — pages turned, rooms quieted.",
      items: books.filter((item) => item.status === "FINISHED"),
    },
    {
      id: "MOVIE",
      title: "My Cinema Archive",
      description: "Films already watched — light remembered after the credits.",
      items: movies.filter((item) => item.status === "FINISHED"),
    },
    {
      id: "MUSIC",
      title: "My Sound Library",
      description: "Music already listened — tones that stayed in the air.",
      items: music.filter((item) => item.status === "FINISHED"),
    },
  ];

  const hasAny = groups.some((group) => group.items.length > 0);
  if (!hasAny) return null;

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Collections
        </h2>
        <p className="text-sm text-white/40">
          Personal archives of what you have already finished
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          if (group.items.length === 0) return null;

          const previews = group.items.slice(0, 5);
          const count = group.items.length;

          return (
            <article
              key={group.id}
              className={cn(
                "flex flex-col gap-5 border border-white/[0.07] bg-[#0E141C] px-5 py-5",
                "rounded-[18px] md:flex-row md:items-center md:justify-between",
              )}
            >
              <div className="min-w-0 max-w-md">
                <h3 className="font-display text-[18px] font-semibold tracking-tight text-white/90">
                  {group.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                  {group.description}
                </p>
                <p className="mt-3 font-label text-[11px] uppercase tracking-[0.14em] text-white/30">
                  {count} {count === 1 ? "work" : "works"}
                </p>
              </div>

              <ul className="flex items-end gap-2.5 md:shrink-0">
                {previews.map((item, index) => (
                  <li
                    key={item.mediaKey}
                    className="w-[52px] md:w-[64px]"
                    style={{ zIndex: previews.length - index }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      aria-label={`Open ${item.title}`}
                      className="block w-full transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
