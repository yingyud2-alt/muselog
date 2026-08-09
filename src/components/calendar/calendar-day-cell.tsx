"use client";

import { Plus } from "lucide-react";

import { EmptyDayDecoration } from "@/components/calendar/empty-day-decoration";
import { MemoryDayCard } from "@/components/calendar/memory-day-card";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

export const JOURNAL_COVER_DRAG_MIME = "application/x-muselog-journal-cover";

type CalendarDayCellProps = {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  /** Memories whose journey starts on this day. */
  startEntries?: MediaItem[];
  isDropTarget?: boolean;
  isDragging?: boolean;
  draggingItemId?: string | null;
  onSelectDate: (date: string) => void;
  onOpenEntry: (item: MediaItem) => void;
  onDropCover?: (itemId: string, date: string) => void;
  onDragHover?: (date: string | null) => void;
  onDragItemStart?: (itemId: string) => void;
  onDragItemEnd?: () => void;
  variant?: "desktop" | "mobile";
};

/**
 * Month-grid day cell — Apple calendar structure, archive cover cards inside.
 */
export function CalendarDayCell({
  day,
  date,
  isCurrentMonth,
  isToday = false,
  isSelected = false,
  startEntries = [],
  isDropTarget = false,
  isDragging = false,
  draggingItemId = null,
  onSelectDate,
  onOpenEntry,
  onDropCover,
  onDragHover,
  onDragItemStart,
  onDragItemEnd,
  variant = "desktop",
}: CalendarDayCellProps) {
  const isMobile = variant === "mobile";
  const primary = startEntries[0];
  const overflow = Math.max(0, startEntries.length - 1);
  const isSourceDay = Boolean(
    draggingItemId && startEntries.some((item) => item.id === draggingItemId),
  );

  if (!isCurrentMonth) {
    return (
      <EmptyDayDecoration
        day={day}
        isCurrentMonth={isCurrentMonth}
        variant={variant}
      />
    );
  }

  return (
    <div
      role="gridcell"
      data-calendar-date={date}
      onDragOver={(event) => {
        if (!onDropCover || !isDragging) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragHover?.(date);
      }}
      onDragEnter={(event) => {
        if (!onDropCover || !isDragging) return;
        event.preventDefault();
        onDragHover?.(date);
      }}
      onDragLeave={(event) => {
        const related = event.relatedTarget;
        if (
          related instanceof Node &&
          event.currentTarget.contains(related)
        ) {
          return;
        }
        onDragHover?.(null);
      }}
      onDrop={(event) => {
        if (!onDropCover) return;
        event.preventDefault();
        event.stopPropagation();
        onDragHover?.(null);
        const id =
          event.dataTransfer.getData(JOURNAL_COVER_DRAG_MIME) ||
          event.dataTransfer.getData("text/plain");
        if (id) onDropCover(id, date);
        onDragItemEnd?.();
      }}
      className={cn(
        "group relative z-0 flex h-full min-h-0 flex-col bg-[#0E131A] px-1.5 pb-2 pt-1.5 transition-[background-color,box-shadow,ring-color] duration-200",
        isMobile ? "min-h-[118px] px-1 pb-1.5 pt-1" : "min-h-[148px] md:min-h-[158px]",
        "hover:z-20 hover:bg-[#121821]",
        isToday && "bg-[#141A22]",
        isSelected && "bg-[#171E28]",
        isDropTarget &&
          "z-30 bg-[#1A2430] ring-1 ring-inset ring-teal-200/35 shadow-[inset_0_0_24px_rgba(94,234,212,0.08)]",
        isSourceDay && !isDropTarget && "bg-[#10161E]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDate(date)}
        aria-label={`Add to Journal on ${date}`}
        className={cn(
          "mb-1 flex w-full shrink-0 items-center justify-between",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center tabular-nums leading-none",
            isMobile ? "size-5 text-[11px]" : "size-6 text-[12px]",
            isToday
              ? "rounded-full bg-white/90 font-semibold text-[#0D1117]"
              : "font-medium text-white/55",
            isDropTarget && !isToday && "text-teal-100/80",
          )}
        >
          {day}
        </span>
        {startEntries.length === 0 ? (
          <span
            aria-hidden="true"
            className={cn(
              "opacity-0 transition-opacity group-hover:opacity-100",
              isDropTarget && "opacity-100",
            )}
          >
            <Plus
              className={cn(
                "size-3 text-white/30",
                isDropTarget && "text-teal-200/70",
              )}
            />
          </span>
        ) : null}
      </button>

      <div className="relative flex min-h-0 flex-1 flex-col items-stretch justify-start overflow-visible">
        {primary ? (
          <>
            <MemoryDayCard
              item={primary}
              variant={variant}
              isDragging={draggingItemId === primary.id}
              dragActive={isDragging}
              onOpen={onOpenEntry}
              onDragStart={(event, item) => {
                event.dataTransfer.setData(JOURNAL_COVER_DRAG_MIME, item.id);
                event.dataTransfer.setData("text/plain", item.id);
                event.dataTransfer.effectAllowed = "move";

                const cover = event.currentTarget.querySelector<HTMLElement>(
                  "[data-memory-cover]",
                );
                if (cover) {
                  const rect = cover.getBoundingClientRect();
                  const preview = cover.cloneNode(true) as HTMLElement;
                  preview.style.position = "fixed";
                  preview.style.top = "-9999px";
                  preview.style.left = "-9999px";
                  preview.style.width = `${rect.width}px`;
                  preview.style.opacity = "0.92";
                  preview.style.pointerEvents = "none";
                  preview.style.zIndex = "9999";
                  document.body.appendChild(preview);
                  event.dataTransfer.setDragImage(
                    preview,
                    rect.width / 2,
                    rect.height / 2,
                  );
                  window.setTimeout(() => preview.remove(), 0);
                }

                onDragItemStart?.(item.id);
              }}
              onDragEnd={() => {
                onDragHover?.(null);
                onDragItemEnd?.();
              }}
            />
            {overflow > 0 ? (
              <p
                className={cn(
                  "mt-1 text-center text-white/35",
                  isMobile ? "text-[8px]" : "text-[9px]",
                )}
              >
                +{overflow} more
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
