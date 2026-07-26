"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { JourneyHighlightBar } from "@/components/calendar/JourneyHighlightBar";
import {
  formatFinishLabel,
  formatJourneyRange,
  getJourneyColor,
  getMediaTypeEmoji,
} from "@/lib/calendar/journey-utils";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type JourneyCardProps = {
  item: MediaItem;
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
};

function JourneyCard({ item, onSelect }: JourneyCardProps) {
  const finishLabel = formatFinishLabel(item);
  const color = getJourneyColor(item);

  return (
    <button
      type="button"
      onClick={(event) => onSelect(item, event.currentTarget)}
      className={cn(
        "group w-full rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-4 text-left",
        "shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md",
        "transition-colors hover:border-white/12 hover:bg-white/[0.05]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
      )}
    >
      <div className="flex gap-4">
        <MemoryCover
          cover={item.cover}
          title={item.title}
          className="w-[56px] shrink-0 rounded-[10px] md:w-[64px]"
        />

        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-sm font-medium leading-snug text-white/90 group-hover:text-white">
            <span aria-hidden="true">{getMediaTypeEmoji(item.type)} </span>
            {item.title}
          </p>

          <JourneyHighlightBar color={color} />

          <p className="text-xs text-white/45">{formatJourneyRange(item)}</p>

          {finishLabel && (
            <p className="text-[11px] italic text-white/38">{finishLabel}</p>
          )}
        </div>
      </div>
    </button>
  );
}

type MediaJourneyLayerProps = {
  items: MediaItem[];
  onSelect: (item: MediaItem, trigger: HTMLElement) => void;
  className?: string;
};

export function MediaJourneyLayer({
  items,
  onSelect,
  className,
}: MediaJourneyLayerProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        Media journey
      </p>
      <p className="mt-1 text-sm text-white/45">
        When you lived with each book, film, or album.
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <JourneyCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
