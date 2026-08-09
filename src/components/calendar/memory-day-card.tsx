"use client";

import { useRef, type DragEvent } from "react";

import { MemoryBlockMenu } from "@/components/calendar/memory-block-menu";
import { MemoryCover } from "@/components/calendar/memory-cover";
import { MemoryJourneyIndicator } from "@/components/calendar/memory-journey-indicator";
import { isMultiDayJourney } from "@/lib/calendar/journey-overlay-utils";
import { getJourneyStart } from "@/lib/calendar/journey-utils";
import { CalendarMediaIcon } from "@/lib/calendar/media-icon";
import { cn } from "@/lib/utils";
import type { MediaItem, MediaType } from "@/types/media";

type MemoryDayCardProps = {
  item: MediaItem;
  variant?: "desktop" | "mobile";
  className?: string;
  /** This card is the active drag source. */
  isDragging?: boolean;
  /** Any journal card is currently being dragged. */
  dragActive?: boolean;
  onOpen: (item: MediaItem) => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>, item: MediaItem) => void;
  onDragEnd?: (event: DragEvent<HTMLButtonElement>) => void;
};

const TYPE_LABEL: Record<MediaType, string> = {
  book: "Book",
  movie: "Movie",
  music: "Music",
};

function formatMemoryDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatStars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}

/**
 * In-cell journal memory — cover-forward, card-owned journey mark.
 * Hover reveals "…" actions (edit / work detail / delete memory).
 */
export function MemoryDayCard({
  item,
  variant = "desktop",
  className,
  isDragging = false,
  dragActive = false,
  onOpen,
  onDragStart,
  onDragEnd,
}: MemoryDayCardProps) {
  const isMobile = variant === "mobile";
  const date = getJourneyStart(item) || item.date;
  const quote = item.quote?.trim();
  const hasRating = typeof item.rating === "number" && item.rating > 0;
  const suppressClickRef = useRef(false);
  const multiDay = isMultiDayJourney(item);

  return (
    <div
      className={cn(
        "group/card relative z-0 w-full min-w-0",
        "hover:z-30 focus-within:z-30",
        isDragging && "scale-[0.96] opacity-35",
        dragActive && !isDragging && "opacity-80",
        "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
    >
      <MemoryBlockMenu item={item} />

      <button
        type="button"
        draggable={Boolean(onDragStart)}
        title={`${item.title} — drag to another day`}
        aria-label={`${item.title}. ${formatMemoryDate(date)}. Drag to move to another date.`}
        aria-grabbed={isDragging}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onOpen(item);
        }}
        onDragStart={
          onDragStart
            ? (event) => {
                event.stopPropagation();
                suppressClickRef.current = true;
                onDragStart(event, item);
              }
            : undefined
        }
        onDragEnd={(event) => {
          onDragEnd?.(event);
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 80);
        }}
        className={cn(
          "flex w-full min-w-0 flex-col items-stretch text-left",
          "cursor-grab rounded-lg active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
        )}
      >
        <div data-memory-cover className="relative mx-auto">
          <MemoryCover
            cover={item.cover}
            title={item.title}
            overlay="none"
            imageClassName={cn(
              "origin-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              !dragActive && "motion-safe:group-hover/card:scale-105",
            )}
            className={cn(
              "mx-auto ring-1 ring-white/16",
              "shadow-[0_6px_18px_rgba(0,0,0,0.4)]",
              "transition-[box-shadow,ring-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              !dragActive &&
                "group-hover/card:shadow-[0_12px_28px_rgba(0,0,0,0.55),0_0_22px_rgba(255,255,255,0.08)]",
              !dragActive && "group-hover/card:ring-white/28",
              isDragging &&
                "shadow-[0_10px_24px_rgba(0,0,0,0.5)] ring-white/30",
              isMobile
                ? "w-[36px] rounded-[5px]"
                : "w-[50px] rounded-[7px] md:w-[56px]",
            )}
          />
        </div>

        {multiDay ? (
          <div
            className={cn(
              "transition-opacity duration-200 ease-out",
              !dragActive && "group-hover/card:opacity-0",
              isDragging && "opacity-0",
            )}
          >
            <MemoryJourneyIndicator item={item} variant={variant} />
            <p
              className={cn(
                "mt-1 truncate text-center font-medium leading-tight text-white/88",
                isMobile ? "text-[9px]" : "text-[10px] md:text-[11px]",
              )}
            >
              {item.title}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "mt-1.5 min-w-0 transition-opacity duration-200 ease-out",
              !dragActive && "group-hover/card:opacity-0",
              isDragging && "opacity-0",
              isMobile ? "mt-1" : "mt-1.5",
            )}
          >
            <p
              className={cn(
                "truncate font-medium leading-tight text-white/88",
                isMobile ? "text-[9px]" : "text-[10px] md:text-[11px]",
              )}
            >
              {item.title}
            </p>
            <div
              className={cn(
                "mt-0.5 flex min-w-0 items-center gap-1 text-white/40",
                isMobile ? "text-[8px]" : "text-[9px]",
              )}
            >
              <CalendarMediaIcon
                type={item.type}
                className={cn(
                  isMobile ? "size-2.5 shrink-0" : "size-3 shrink-0",
                )}
              />
              <span className="truncate tabular-nums">
                {formatMemoryDate(date)}
              </span>
            </div>
          </div>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-[calc(100%-0.25rem)] z-40",
            "origin-top scale-[0.98] opacity-0",
            "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            !dragActive &&
              "group-hover/card:scale-100 group-hover/card:opacity-100",
            "max-md:hidden",
          )}
          aria-hidden="true"
        >
          <div
            className={cn(
              "rounded-xl border border-white/[0.1] bg-[#121820]/95 p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
              "backdrop-blur-md",
            )}
          >
            <p className="truncate text-[11px] font-medium leading-tight text-white/92">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-white/50">
              {item.creator}
            </p>

            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[9px] text-white/42">
              <CalendarMediaIcon type={item.type} className="size-3 shrink-0" />
              <span className="truncate">{TYPE_LABEL[item.type]}</span>
              {hasRating ? (
                <>
                  <span className="text-white/20">·</span>
                  <span
                    className="truncate tracking-[0.04em] text-amber-200/75"
                    aria-label={`Rated ${item.rating} of 5`}
                  >
                    {formatStars(item.rating)}
                  </span>
                </>
              ) : null}
            </div>

            {quote ? (
              <p className="mt-1.5 line-clamp-2 text-[9px] leading-snug text-white/45 italic">
                “{quote}”
              </p>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  );
}
