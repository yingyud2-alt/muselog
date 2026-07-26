"use client";

import { formatProfileDate } from "@/lib/profile/profile-utils";
import type { MemoryHighlight } from "@/types/profile";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MemoryHighlightsProps = {
  highlights: MemoryHighlight[];
  onSelect?: (entry: MediaItem) => void;
  className?: string;
};

export function MemoryHighlights({
  highlights,
  onSelect,
  className,
}: MemoryHighlightsProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Favorite Memories
        </h2>
        <p className="text-sm text-white/40">
          Quiet highlights from your journal
        </p>
      </div>

      <ul className="space-y-3">
        {highlights.map((highlight) => (
          <li key={highlight.id}>
            <button
              type="button"
              onClick={() => onSelect?.(highlight.journalItem)}
              className={cn(
                "w-full rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 text-left",
                "shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl",
                "transition-colors hover:bg-white/[0.05]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[15px] font-medium text-white/88">
                  {highlight.title}
                </p>
                <p className="shrink-0 text-[12px] text-white/34">
                  {formatProfileDate(highlight.date)}
                </p>
              </div>
              <p className="mt-1 text-[12px] text-white/40">{highlight.creator}</p>
              <p className="font-body mt-3 text-sm leading-relaxed text-white/58">
                {highlight.excerpt}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
