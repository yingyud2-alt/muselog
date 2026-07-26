"use client";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import {
  deriveLibraryMoodTags,
  formatLibraryAddedDate,
} from "@/components/library/library-visual-utils";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type LibraryShelfProps = {
  title?: string;
  description?: string;
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  emptyMessage?: string;
  cardWidth?: "sm" | "md" | "lg";
  showReason?: boolean;
  getReason?: (item: LibraryItem) => string | null;
  /** collectible = Apple Music / Kindle shelf cards */
  variant?: "default" | "collectible" | "recent";
};

export function LibraryShelf({
  title,
  description,
  items,
  onSelect,
  emptyMessage = "Nothing here yet.",
  cardWidth = "sm",
  showReason = false,
  getReason,
  variant = "default",
}: LibraryShelfProps) {
  const widthClass =
    cardWidth === "lg"
      ? "w-[148px]"
      : cardWidth === "md"
        ? "w-[132px]"
        : "w-[112px]";

  const recent = variant === "recent";
  const collectible = variant === "collectible" || recent;

  return (
    <section className="space-y-4">
      {(title || description) && (
        <div className="space-y-1">
          {title ? (
            <h2 className="text-xl font-medium tracking-tight text-white/90">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm text-white/40">{description}</p>
          ) : null}
        </div>
      )}

      {items.length === 0 ? (
        <MuseEmptyState
          title="No memories yet."
          description={emptyMessage}
          actionLabel="Start your first journey"
          actionHref="/explore"
        />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {items.map((item) => {
            const moodTags = recent ? deriveLibraryMoodTags(item) : [];
            const addedDate = recent
              ? formatLibraryAddedDate(item.createdAt)
              : "";

            return (
              <button
                key={item.mediaKey}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "group shrink-0 text-left transition-transform duration-300 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                  recent ? "w-[168px]" : collectible ? "w-[140px]" : widthClass,
                )}
              >
                <LibraryArchiveCover
                  cover={item.cover}
                  title={item.title}
                  className={cn(
                    "rounded-[16px]",
                    "transition-transform duration-300 group-hover:brightness-[1.03]",
                  )}
                />
                <div className="mt-3 space-y-1 px-0.5">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/88">
                    {item.title}
                  </p>
                  <p className="truncate text-[12px] text-white/40">
                    {item.creator}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/28">
                    <MediaIcon
                      type={item.type}
                      className="size-3"
                      style={{ opacity: 0.6 }}
                    />
                    <span>{CONTENT_TYPE_LABELS[item.type]}</span>
                  </div>
                  {recent ? (
                    <>
                      <LibraryMoodTags tags={moodTags} className="pt-1.5" />
                      {addedDate ? (
                        <p className="pt-1 font-label text-[10px] tracking-[0.04em] text-white/30">
                          Added {addedDate}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {showReason && getReason?.(item) ? (
                    <p className="pt-0.5 text-[11px] text-white/32">
                      {getReason(item)}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
