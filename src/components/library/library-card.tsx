"use client";

import { MemoryStars } from "@/components/calendar/memory-stars";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryCardQuickActions } from "@/components/library/library-card-quick-actions";
import {
  getLibraryLabels,
  getLibraryStatusLabel,
} from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type LibraryCardProps = {
  item: LibraryItem;
  onSelect: (item: LibraryItem) => void;
};

export function LibraryCard({ item, onSelect }: LibraryCardProps) {
  const labels = getLibraryLabels(item.type);
  const statusLabel = getLibraryStatusLabel(
    item.type,
    item.status,
    item.progress,
  );

  return (
    <article className="group w-full">
      <button
        type="button"
        aria-label={`Open ${item.title}`}
        onClick={() => onSelect(item)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#0E141C] transition-transform duration-300 group-hover:-translate-y-0.5">
          <LibraryArchiveCover
            cover={item.cover}
            title={item.title}
            className="rounded-none"
          />

          <div className="space-y-1.5 p-2.5 md:p-3">
            <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-white/88 md:text-sm">
              {item.title}
            </h3>
            <p className="truncate text-[11px] text-white/42 md:text-xs">
              {item.creator}
            </p>

            {item.status === "FINISHED" && item.rating && item.rating > 0 ? (
              <div className="flex items-center gap-1.5 pt-0.5">
                <MemoryStars rating={item.rating} size="xs" />
                <span className="text-[10px] text-white/40">
                  {labels.finished}
                </span>
              </div>
            ) : item.status === "ONGOING" &&
              typeof item.progress === "number" &&
              item.progress > 0 ? (
              <div className="pt-1">
                <div className="mb-1 text-[10px] text-white/45">
                  {statusLabel}
                </div>
                <div className="h-[2px] overflow-hidden bg-white/10">
                  <div
                    className={cn("h-full bg-[#6D8FA3]")}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-white/45 md:text-[11px]">
                {statusLabel}
              </p>
            )}
          </div>
        </div>
      </button>

      <LibraryCardQuickActions
        item={item}
        density="compact"
        className="mt-2"
      />
    </article>
  );
}
