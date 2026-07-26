"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { MEDIA_TYPE_LABELS } from "@/lib/calendar/constants";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

type ImportantMemoryCardProps = {
  item: MediaItem;
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
};

function formatTimeline(item: MediaItem): string | null {
  if (item.startDate && item.endDate && item.startDate !== item.endDate) {
    return `${item.startDate} → ${item.endDate}`;
  }
  return item.date || item.startDate || item.endDate || null;
}

export function ImportantMemoryCard({
  item,
  onSelect,
}: ImportantMemoryCardProps) {
  const quoteOrNote = item.quote
    ? `“${item.quote}”`
    : item.note || item.moment || null;
  const keywords = item.tags.slice(0, 4);
  const timeline = formatTimeline(item);
  const hasCover = Boolean(item.cover?.trim());

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "md:hover:-translate-y-0.5 md:hover:border-white/[0.12]",
        "md:hover:shadow-[0_16px_36px_rgba(0,0,0,0.28)]",
      )}
    >
      <div className="flex flex-col md:flex-row">
        <button
          type="button"
          onClick={(event) => onSelect(item, event.currentTarget)}
          className={cn(
            "relative shrink-0 overflow-hidden outline-none",
            "w-full md:w-[7.5rem] lg:w-[8.5rem]",
            "focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0F]",
          )}
          aria-label={`Open memory: ${item.title}`}
        >
          {hasCover ? (
            <MemoryCover
              cover={item.cover}
              title={item.title}
              overlay="soft"
              className={cn(
                "aspect-[16/10] rounded-none md:aspect-[2/3] md:min-h-full",
                "shadow-none ring-0",
                "transition-[filter,opacity] duration-300 ease-out",
                "md:group-hover:brightness-110",
              )}
            />
          ) : (
            <div
              className={cn(
                "flex aspect-[16/10] items-center justify-center bg-white/[0.04] md:aspect-[2/3] md:min-h-full",
                "transition-[filter,opacity] duration-300 ease-out md:group-hover:brightness-110",
              )}
              aria-hidden="true"
            >
              <span className="font-label text-[10px] uppercase tracking-[0.16em] text-white/22">
                {MEDIA_TYPE_LABELS[item.type]}
              </span>
            </div>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 md:px-5 md:py-5">
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
            {MEDIA_TYPE_LABELS[item.type]}
          </p>
          <h3 className="font-display mt-1 text-base font-normal text-white/88 md:text-[17px]">
            {item.title}
          </h3>
          <p className="font-label mt-0.5 text-[11px] text-white/40">
            {item.creator}
          </p>

          {timeline ? (
            <p className="font-label mt-2 text-[10px] tracking-[0.04em] text-white/28">
              {timeline}
            </p>
          ) : null}

          {quoteOrNote ? (
            <p className="font-display mt-2.5 line-clamp-2 text-sm leading-relaxed text-white/48">
              {quoteOrNote}
            </p>
          ) : null}

          {keywords.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {keywords.map((tag) => (
                <li
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full",
                    "border border-white/[0.06] bg-white/[0.04] px-2 py-0.5",
                    "font-label text-[10px] tracking-[0.02em] text-white/38",
                  )}
                >
                  <span className="text-[8px] text-white/28" aria-hidden="true">
                    ○
                  </span>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
