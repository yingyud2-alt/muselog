"use client";

import { MemoryStars } from "@/components/calendar/memory-stars";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryCardQuickActions } from "@/components/library/library-card-quick-actions";
import { formatLibraryAddedDate } from "@/components/library/library-visual-utils";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type RecentlyFinishedProps = {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
};

export function RecentlyFinished({ items, onSelect }: RecentlyFinishedProps) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Recently Finished
        </h2>
        <p className="text-sm text-white/40">
          Works you have closed — with the mark they left behind
        </p>
      </div>

      {items.length === 0 ? (
        <MuseEmptyState
          title="Nothing finished yet."
          description="When a journey ends, it will settle here."
          actionLabel="Explore titles"
          actionHref="/explore"
        />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {items.map((item) => {
            const completed = item.endDate
              ? formatLibraryAddedDate(item.endDate)
              : formatLibraryAddedDate(item.updatedAt);

            return (
              <article
                key={item.mediaKey}
                className="group w-[168px] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    "w-full text-left transition-transform duration-300 hover:-translate-y-0.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                  )}
                >
                  <LibraryArchiveCover
                    cover={item.cover}
                    title={item.title}
                    className="rounded-[16px] transition-transform duration-300 group-hover:brightness-[1.03]"
                  />
                  <div className="mt-3 space-y-1 px-0.5">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/88">
                      {item.title}
                    </p>
                    {completed ? (
                      <p className="font-label text-[10px] tracking-[0.04em] text-white/30">
                        Finished {completed}
                      </p>
                    ) : null}
                    {item.rating && item.rating > 0 ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <MemoryStars rating={item.rating} size="xs" />
                        <span className="text-[10px] text-white/40">
                          {item.rating}/5
                        </span>
                      </div>
                    ) : (
                      <p className="pt-0.5 text-[10px] text-white/32">
                        Not rated yet
                      </p>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openJournalQuickLog(item.mediaKey, {
                      snapshot: {
                        title: item.title,
                        creator: item.creator,
                        type: item.type,
                        cover: item.cover,
                      },
                    });
                  }}
                  className="mt-2 px-0.5 text-[11px] text-white/45 transition-colors hover:text-white/72 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                >
                  Journal
                </button>

                <LibraryCardQuickActions
                  item={item}
                  density="compact"
                  className="mt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
