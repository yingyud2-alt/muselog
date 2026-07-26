"use client";

import { ArrowRight } from "lucide-react";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import { formatJourneyDay } from "@/lib/calendar/journey-utils";
import { getLibraryLabels } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type CurrentlyExploringProps = {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
};

export function CurrentlyExploring({
  items,
  onSelect,
}: CurrentlyExploringProps) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Currently Exploring
        </h2>
        <p className="text-sm text-white/40">
          Active cultural journeys still open on your shelf
        </p>
      </div>

      {items.length === 0 ? (
        <MuseEmptyState
          title="Nothing in progress."
          description="Start your first journey from Explore or your waiting list."
          actionLabel="Start your first journey"
          actionHref="/explore"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const labels = getLibraryLabels(item.type);
            const progress = Math.min(100, Math.max(0, item.progress ?? 0));
            const startLine = item.startDate
              ? `Started ${formatJourneyDay(item.startDate)}`
              : "Just opened";

            return (
              <button
                key={item.mediaKey}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "group border border-white/[0.07] bg-[#0E141C] p-4 text-left",
                  "rounded-[18px] transition-colors duration-300 hover:bg-[#121A24]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                )}
              >
                <div className="flex gap-4">
                  <LibraryArchiveCover
                    cover={item.cover}
                    title={item.title}
                    className="w-[88px] shrink-0 rounded-[12px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[16px] font-medium text-white/92">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-white/42">
                      {item.creator}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-label text-[10px] uppercase tracking-[0.14em] text-[#93ACAA]">
                        {labels.ongoing}
                      </span>
                      <span className="text-[12px] text-white/38">
                        {startLine}
                      </span>
                    </div>

                    <div className="mt-3 h-[2px] overflow-hidden bg-white/[0.08]">
                      <div
                        className="h-full bg-[#6D8FA3] transition-all"
                        style={{ width: `${progress || 8}%` }}
                      />
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-[12px] tabular-nums text-white/38">
                        {progress > 0 ? `${progress}%` : "Just started"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-white/55 transition-colors group-hover:text-white/80">
                        Continue Journey
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
