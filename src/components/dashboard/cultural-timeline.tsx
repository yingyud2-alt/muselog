"use client";

import { useRouter } from "next/navigation";

import { MemoryCover } from "@/components/calendar/memory-cover";
import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";
import type { DashboardTimelineEntry } from "@/hooks/use-desktop-dashboard";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type CulturalTimelineProps = {
  entries: DashboardTimelineEntry[];
  onSelect: (entry: MediaItem) => void;
};

export function CulturalTimeline({ entries, onSelect }: CulturalTimelineProps) {
  const router = useRouter();
  const monthLabel = entries[0]?.monthLabel ?? "July";

  const handleSelect = (entry: DashboardTimelineEntry) => {
    if (entry.journalItem?.id) {
      onSelect(entry.journalItem);
      return;
    }

    if (entry.exploreHref) {
      router.push(entry.exploreHref);
    }
  };

  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Cultural Timeline"
        description="How your media journey evolves"
      />

      <DashboardGlassCard className="overflow-hidden p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
          {monthLabel} Journey
        </p>

        <div className="relative mt-5">
          <div
            className="absolute left-[18px] top-3 bottom-3 w-px bg-white/10 md:left-[22px]"
            aria-hidden="true"
          />

          <div className="flex gap-4 overflow-x-auto pb-2 md:gap-5">
            {entries.map((entry) => {
              const isInteractive = Boolean(entry.journalItem?.id || entry.exploreHref);

              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={!isInteractive}
                  onClick={() => handleSelect(entry)}
                  className={cn(
                    "relative flex w-[148px] shrink-0 flex-col pl-8 text-left md:w-[168px] md:pl-10",
                    isInteractive &&
                      "cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                    !isInteractive && "cursor-default",
                  )}
                >
                  <div
                    className="absolute left-3 top-2 size-2.5 rounded-full border border-white/20 bg-[#0D1117] md:left-4"
                    aria-hidden="true"
                  />

                  <p className="text-2xl font-light tabular-nums text-white/82">
                    {entry.dayOfMonth}
                  </p>

                  <MemoryCover
                    cover={entry.cover}
                    title={entry.title}
                    className="mt-3 w-full rounded-xl"
                  />

                  <p className="mt-3 truncate text-sm font-medium text-white/85">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-xs text-white/42">{entry.typeLabel}</p>
                </button>
              );
            })}
          </div>
        </div>
      </DashboardGlassCard>
    </section>
  );
}
