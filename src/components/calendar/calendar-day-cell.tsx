"use client";

import { Plus } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { EmptyDayDecoration } from "@/components/calendar/empty-day-decoration";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

export const JOURNAL_COVER_DRAG_MIME = "application/x-muselog-journal-cover";

type CalendarDayCellProps = {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  /** Covers whose journey starts on this day. */
  startEntries?: MediaItem[];
  isDropTarget?: boolean;
  onSelectDate: (date: string) => void;
  onOpenEntry: (item: MediaItem) => void;
  onDropCover?: (itemId: string, date: string) => void;
  onDragHover?: (date: string | null) => void;
  variant?: "desktop" | "mobile";
};

/**
 * Compact monthly journal day — fixed height.
 * Cover sits in-cell; period line is drawn by the week overlay.
 */
export function CalendarDayCell({
  day,
  date,
  isCurrentMonth,
  isToday = false,
  isSelected = false,
  startEntries = [],
  isDropTarget = false,
  onSelectDate,
  onOpenEntry,
  onDropCover,
  onDragHover,
  variant = "desktop",
}: CalendarDayCellProps) {
  const isMobile = variant === "mobile";
  const visible = startEntries.slice(0, 2);
  const overflow = startEntries.length - visible.length;

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
        if (!onDropCover) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragHover?.(date);
      }}
      onDragEnter={(event) => {
        if (!onDropCover) return;
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
      }}
      className={cn(
        "group relative z-10 flex flex-col overflow-hidden rounded-[10px] transition-colors",
        isMobile
          ? "h-[56px] px-0.5 pt-0.5"
          : "h-[64px] px-1 pt-0.5 md:h-[68px] md:rounded-[12px]",
        "hover:bg-white/[0.04]",
        isToday && "ring-1 ring-white/14",
        isSelected && "bg-white/[0.05] ring-1 ring-white/18",
        isDropTarget && "bg-white/[0.12] ring-2 ring-white/40",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDate(date)}
        aria-label={`Add to Journal on ${date}`}
        className={cn(
          "flex w-full shrink-0 items-start justify-between",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
        )}
      >
        <span
          className={cn(
            "tabular-nums leading-none text-white/55",
            isMobile ? "text-[10px]" : "text-[11px]",
            isToday && "font-medium text-white/85",
          )}
        >
          {day}
        </span>
        {startEntries.length === 0 ? (
          <span
            aria-hidden="true"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Plus className="size-2.5 text-white/35" />
          </span>
        ) : null}
      </button>

      <div className="mt-0.5 flex min-h-0 flex-1 items-end gap-0.5 overflow-hidden pb-1">
        {visible.map((item) => {
          const mood = item.tags?.[0];
          return (
            <button
              key={item.id}
              type="button"
              draggable
              title={`${item.title}${mood ? ` · ${mood}` : ""}`}
              aria-label={`${item.title}. Drag cover to move start date.`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenEntry(item);
              }}
              onDragStart={(event) => {
                event.stopPropagation();
                event.dataTransfer.setData(JOURNAL_COVER_DRAG_MIME, item.id);
                event.dataTransfer.setData("text/plain", item.id);
                event.dataTransfer.effectAllowed = "move";
                event.currentTarget.style.opacity = "0.4";
              }}
              onDragEnd={(event) => {
                event.currentTarget.style.opacity = "1";
                onDragHover?.(null);
              }}
              className={cn(
                "cursor-grab rounded active:cursor-grabbing",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
              )}
            >
              <MemoryCover
                cover={item.cover}
                title={item.title}
                className={cn(
                  "rounded-[3px] ring-1 ring-white/16",
                  isMobile
                    ? "aspect-[2/3] w-[18px] max-h-[24px]"
                    : "aspect-[2/3] w-[22px] max-h-[30px]",
                )}
              />
            </button>
          );
        })}
        {overflow > 0 ? (
          <span className="pb-0.5 text-[8px] leading-none text-white/35">
            +{overflow}
          </span>
        ) : null}
      </div>
    </div>
  );
}
