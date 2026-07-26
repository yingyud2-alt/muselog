"use client";

import type { ProfileTimelineYear } from "@/types/profile";
import type { MediaItem } from "@/types/media";

type ProfileTimelineProps = {
  timeline: ProfileTimelineYear[];
  onSelect: (entry: MediaItem) => void;
};

export function ProfileTimeline({ timeline, onSelect }: ProfileTimelineProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Timeline</h2>

      {timeline.length === 0 ? (
        <p className="mt-4 text-sm text-white/42">
          Your cultural timeline will appear as you add journal entries.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {timeline.map((yearGroup) => (
            <div key={yearGroup.year}>
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                {yearGroup.year}
              </p>
              <div className="mt-4 space-y-6 border-l border-white/10 pl-5 md:pl-6">
                {yearGroup.months.map((monthGroup) => (
                  <div key={`${yearGroup.year}-${monthGroup.month}`}>
                    <p className="text-sm font-medium text-white/58">
                      {monthGroup.month}
                    </p>
                    <ul className="mt-3 space-y-3">
                      {monthGroup.entries.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(entry.journalItem)}
                            className="w-full text-left transition-colors hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
                          >
                            <p className="text-sm text-white/82">{entry.title}</p>
                            <p className="mt-0.5 text-xs text-white/40">
                              {entry.statusLabel}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
