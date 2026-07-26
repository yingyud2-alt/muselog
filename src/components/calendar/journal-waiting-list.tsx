"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import type { Content } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type JournalWaitingListProps = {
  items: Content[];
  onAdd: (content: Content) => void;
  emptyMessage?: string;
  onAddManually?: () => void;
};

export function JournalWaitingList({
  items,
  onAdd,
  emptyMessage = "No saved titles found.",
  onAddManually,
}: JournalWaitingListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
        <p className="text-sm text-white/42">{emptyMessage}</p>
        {onAddManually && (
          <button
            type="button"
            onClick={onAddManually}
            className="mt-4 text-sm text-teal-300/70 hover:text-teal-300/90"
          >
            Add manually
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((content) => (
        <li key={content.id}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2.5">
            <MemoryCover
              cover={content.cover}
              title={content.title}
              className="w-10 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/85">
                {content.title}
              </p>
              <p className="truncate text-xs text-white/42">{content.creator}</p>
            </div>
            <button
              type="button"
              aria-label={`Add ${content.title}`}
              onClick={() => onAdd(content)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                "border border-white/12 bg-white/[0.04] text-lg text-white/65",
                "hover:bg-white/10",
              )}
            >
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
