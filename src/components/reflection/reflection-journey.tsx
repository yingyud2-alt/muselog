"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import type { ReflectionJourneyEntry } from "@/lib/reflection/reflection-types";
import type { MediaItem } from "@/types/media";

type ReflectionJourneyProps = {
  journey: ReflectionJourneyEntry[];
  onSelect: (entry: MediaItem) => void;
};

export function ReflectionJourney({ journey, onSelect }: ReflectionJourneyProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Your Journey</h2>

      {journey.length === 0 ? (
        <p className="mt-4 text-sm text-white/42">
          Add journal entries this month to see your journey unfold here.
        </p>
      ) : (
        <>
          <div className="mt-4 hidden gap-4 overflow-x-auto pb-2 md:flex">
            {journey.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.journalItem)}
                className="w-[140px] shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
              >
                <MemoryCover
                  cover={entry.cover}
                  title={entry.title}
                  className="w-full rounded-xl"
                />
                <p className="mt-2 text-[11px] text-white/40">{entry.dateLabel}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-white/85">
                  {entry.title}
                </p>
                <p className="text-xs text-teal-300/65">{entry.statusLabel}</p>
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {journey.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.journalItem)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left"
                >
                  <MemoryCover
                    cover={entry.cover}
                    title={entry.title}
                    className="w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-white/40">{entry.dateLabel}</p>
                    <p className="truncate text-sm font-medium text-white/85">
                      {entry.title}
                    </p>
                    <p className="truncate text-xs text-white/42">{entry.creator}</p>
                    <p className="mt-0.5 text-xs text-teal-300/65">{entry.statusLabel}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
