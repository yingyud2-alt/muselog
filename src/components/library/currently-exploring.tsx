"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryCardQuickActions } from "@/components/library/library-card-quick-actions";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import { formatJourneyDay } from "@/lib/calendar/journey-utils";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { resolveJournalItemId } from "@/lib/content/bubble-content-bridge";
import { getLibraryLabels } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type CurrentlyExploringProps = {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
};

function latestJournalMemory(
  item: LibraryItem,
  entriesById: Map<string, { note?: string; quote?: string }>,
): string | null {
  const entry = entriesById.get(resolveJournalItemId(item.mediaKey));
  const fromJournal =
    entry?.note?.trim() || entry?.quote?.trim() || null;
  if (fromJournal) return fromJournal;

  const fromLibrary =
    item.shortReview?.trim() || item.notes?.trim() || null;
  return fromLibrary;
}

export function CurrentlyExploring({
  items,
  onSelect,
}: CurrentlyExploringProps) {
  const { entries } = useJournalEntries();
  const entriesById = useMemo(() => {
    const map = new Map<string, { note?: string; quote?: string }>();
    for (const entry of entries) {
      map.set(entry.id, entry);
    }
    return map;
  }, [entries]);

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
            const memory = latestJournalMemory(item, entriesById);

            return (
              <article
                key={item.mediaKey}
                className={cn(
                  "group border border-white/[0.07] bg-[#0E141C] p-4",
                  "rounded-[18px] transition-colors duration-300 hover:bg-[#121A24]",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
                >
                  <LibraryArchiveCover
                    cover={item.cover}
                    title={item.title}
                    className="w-[88px] shrink-0 rounded-[12px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                      {CONTENT_TYPE_LABELS[item.type]}
                    </p>
                    <p className="mt-1 truncate text-[16px] font-medium text-white/92">
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

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[12px] tabular-nums text-white/38">
                        {progress > 0 ? `${progress}%` : "Just started"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-white/55 transition-colors group-hover:text-white/80">
                        Continue Journey
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    {memory ? (
                      <p className="mt-3 line-clamp-2 font-quote text-[12px] leading-relaxed text-white/45">
                        &ldquo;{memory}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-3 text-[12px] text-white/28">
                        No journal memory yet
                      </p>
                    )}
                  </div>
                </button>

                <LibraryCardQuickActions
                  item={item}
                  density="compact"
                  className="mt-3 border-t border-white/[0.06] pt-3"
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
