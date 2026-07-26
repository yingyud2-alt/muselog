"use client";

import { MEDIA_TYPE_EMOJI } from "@/lib/calendar/constants";
import { formatTimelineDate } from "@/lib/calendar/utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

import { MemoryCover } from "./memory-cover";
import { MemoryStars } from "./memory-stars";

type MemoryRiverEntryProps = {
  memory: MediaItem;
  index: number;
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
};

export function MemoryRiverEntry({
  memory,
  index,
  onSelect,
}: MemoryRiverEntryProps) {
  const isReversed = index % 2 === 1;
  const excerpt = memory.quote || memory.note;
  const moodLine = (memory.tags ?? []).slice(0, 3).join(" · ");

  return (
    <article className={cn("relative", index > 0 && "mt-10 md:mt-14")}>
      <p className="mb-4 pl-1 text-sm font-medium text-white/55 md:mb-5 md:text-center md:text-base">
        {formatTimelineDate(memory.date)}
      </p>

      <div
        className={cn(
          "relative md:flex md:items-start md:gap-8",
          isReversed && "md:flex-row-reverse",
        )}
      >
        <div
          aria-hidden="true"
          className="absolute left-[15px] top-0 bottom-0 w-px md:left-1/2 md:-translate-x-1/2"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--journal-line-from, rgba(45,212,191,0.25)), rgba(255,255,255,0.1), transparent)",
          }}
        />

        <button
          type="button"
          onClick={(event) => onSelect(memory, event.currentTarget)}
          className={cn(
            "group relative ml-8 w-[calc(100%-2rem)] text-left md:ml-0 md:w-[calc(50%-24px)]",
            "rounded-[22px] border border-white/[0.08] bg-white/[0.035]",
            "p-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md",
            "transition-all duration-300",
            "hover:border-[color:var(--journal-accent-border)] hover:bg-white/[0.05]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--journal-accent-ring)]",
          )}
        >
          <div
            aria-hidden="true"
            className="absolute -left-[26px] top-6 size-[14px] rounded-full border bg-[#0D1117] md:hidden"
            style={{
              borderColor: "var(--journal-accent-border, rgba(45,212,191,0.35))",
            }}
          />

          <div
            className={cn(
              "flex gap-4",
              isReversed && "md:flex-row-reverse md:text-right",
            )}
          >
            <MemoryCover
              cover={memory.cover}
              title={memory.title}
              className="w-[96px] shrink-0 rounded-[14px] md:w-[112px]"
            />

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-lg" aria-hidden="true">
                {MEDIA_TYPE_EMOJI[memory.type]}
              </p>

              <div>
                <h3 className="text-lg font-medium leading-snug text-white/92 group-hover:text-white">
                  {memory.title}
                </h3>
                <p className="mt-0.5 text-sm text-white/48">{memory.creator}</p>
              </div>

              {excerpt && (
                <p className="font-quote line-clamp-2 text-sm italic leading-relaxed text-white/50">
                  &ldquo;{excerpt}&rdquo;
                </p>
              )}

              {memory.moment && (
                <p className="text-xs lowercase text-white/38">{memory.moment}</p>
              )}

              <MemoryStars rating={memory.rating} size="sm" />

              {moodLine && (
                <p className="text-[11px] lowercase text-white/32">{moodLine}</p>
              )}
            </div>
          </div>
        </button>
      </div>
    </article>
  );
}
