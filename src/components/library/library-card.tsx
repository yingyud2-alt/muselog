"use client";

import { MemoryStars } from "@/components/calendar/memory-stars";
import {
  getLibraryLabels,
  getLibraryStatusLabel,
  PROGRESS_COLORS,
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
    <button
      type="button"
      aria-label={`Open ${item.title}`}
      onClick={() => onSelect(item)}
      className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-transform duration-300 group-hover:-translate-y-0.5">
        <div
          className={cn(
            "relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br ring-1 ring-white/10",
            item.cover,
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
        </div>

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
              <span className="text-[10px] text-white/40">{labels.finished}</span>
            </div>
          ) : item.status === "ONGOING" &&
            typeof item.progress === "number" &&
            item.progress > 0 ? (
            <div className="pt-1">
              <div className="mb-1 text-[10px] text-white/45">{statusLabel}</div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", PROGRESS_COLORS[item.type])}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-white/45 md:text-[11px]">{statusLabel}</p>
          )}
        </div>
      </div>
    </button>
  );
}
