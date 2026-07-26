"use client";

import Link from "next/link";

import { MemoryCover } from "@/components/calendar/memory-cover";
import {
  formatProfileDate,
  getJourneyStatusLabel,
} from "@/lib/profile/profile-utils";
import { PROGRESS_COLORS } from "@/lib/library/library-labels";
import type { CurrentJourneyItem } from "@/types/profile";
import { cn } from "@/lib/utils";

type ProfileCurrentJourneyProps = {
  journey: CurrentJourneyItem | null;
  onSelect?: (item: CurrentJourneyItem) => void;
};

export function ProfileCurrentJourney({
  journey,
  onSelect,
}: ProfileCurrentJourneyProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Currently exploring</h2>

      {!journey ? (
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm text-white/45">No active journey yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-block text-sm text-teal-300/75 hover:text-teal-300/95"
          >
            Explore something new
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onSelect?.(journey)}
          className="mt-5 flex w-full items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
        >
          <MemoryCover
            cover={journey.cover}
            title={journey.title}
            className="w-16 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-white/88">
              {journey.title}
            </p>
            <p className="mt-0.5 truncate text-sm text-white/42">
              {journey.creator}
            </p>
            <p className="mt-2 text-xs text-white/50">
              {getJourneyStatusLabel(journey)}
            </p>
            {typeof journey.progress === "number" && journey.progress > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[11px] text-white/40">
                  {journey.progress}%
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn("h-full rounded-full", PROGRESS_COLORS[journey.type])}
                    style={{ width: `${Math.min(100, journey.progress)}%` }}
                  />
                </div>
              </div>
            )}
            {journey.startDate && (
              <p className="mt-3 text-xs text-white/38">
                Started: {formatProfileDate(journey.startDate)}
              </p>
            )}
          </div>
        </button>
      )}
    </section>
  );
}
